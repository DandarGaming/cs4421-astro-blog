import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import { SSR_NAME } from './ssr-image-stack.js';

/** Cluster, service and task family all share this name with scripts and CI. */
export const CLUSTER_NAME = SSR_NAME;
export const SERVICE_NAME = SSR_NAME;
export const TASK_FAMILY = SSR_NAME;
export const LOG_GROUP_NAME = `/aws/ecs/${SSR_NAME}`;

export interface SsrSiteStackProps extends cdk.StackProps {
	/** Hostname CNAME'd to the load balancer, e.g. app.danielsukhanov.me. */
	hostname: string;
	/** Repository from SsrImageStack holding the deployable images. */
	repository: ecr.IRepository;
	/** Tag the CDK-managed baseline task definition pulls. Defaults to `stable`. */
	imageTag?: string;
	/** Existing ACM certificate ARN; when set, an HTTPS listener is added on 443. */
	certificateArn?: string;
	supabaseUrl?: string;
	supabaseKey?: string;
	/** GitHub repository allowed to assume the deploy role, `owner/name`. */
	githubRepository?: string;
	/** Branch allowed to assume the deploy role. Defaults to `main`. */
	githubBranch?: string;
	/** Reuse an existing GitHub OIDC provider instead of creating one. */
	githubOidcProviderArn?: string;
	/** Optional address subscribed to the alarm topic. */
	alarmEmail?: string;
}

/**
 * Server-rendered deployment: the Astro Node standalone server runs on Fargate
 * behind an internet-facing ALB. Content and /api/health are rendered per request.
 */
export class SsrSiteStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: SsrSiteStackProps) {
		super(scope, id, props);

		// Public subnets only: the task gets a public IP and reaches Supabase and
		// the AWS APIs without a NAT gateway, which would cost more than the task.
		// The AZs are explicit, and bin/my-astro-blog.ts supplies the matching
		// availability-zone context, so synthesis never calls AWS for them.
		const vpc = new ec2.Vpc(this, 'Vpc', {
			availabilityZones: [`${this.region}a`, `${this.region}b`],
			natGateways: 0,
			subnetConfiguration: [
				{ name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
			],
		});

		const cluster = new ecs.Cluster(this, 'Cluster', {
			vpc,
			clusterName: CLUSTER_NAME,
		});

		const logGroup = new logs.LogGroup(this, 'ServiceLogs', {
			logGroupName: LOG_GROUP_NAME,
			retention: logs.RetentionDays.ONE_WEEK,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		const taskDefinition = new ecs.FargateTaskDefinition(this, 'Task', {
			family: TASK_FAMILY,
			cpu: 256,
			memoryLimitMiB: 512,
		});

		taskDefinition
			.addContainer('app', {
				image: ecs.ContainerImage.fromEcrRepository(
					props.repository,
					props.imageTag ?? 'stable',
				),
				environment: {
					HOST: '0.0.0.0',
					PORT: '8080',
					NODE_ENV: 'production',
					...(props.supabaseUrl && { SUPABASE_URL: props.supabaseUrl }),
					...(props.supabaseKey && { SUPABASE_KEY: props.supabaseKey }),
				},
				logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'app', logGroup }),
			})
			.addPortMappings({ containerPort: 8080 });

		const service = new ecs.FargateService(this, 'Service', {
			cluster,
			taskDefinition,
			serviceName: SERVICE_NAME,
			desiredCount: 1,
			assignPublicIp: true,
			// The server boots in about a second, so a short grace period is enough
			// for the rollback drill to fail fast instead of waiting a minute.
			healthCheckGracePeriod: cdk.Duration.seconds(15),
			minHealthyPercent: 100,
			maxHealthyPercent: 200,
			circuitBreaker: { rollback: true },
		});

		const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
			vpc,
			internetFacing: true,
			dropInvalidHeaderFields: true,
		});

		// Cloudflare proxies the custom hostname to this listener over HTTP, so it
		// stays open even when HTTPS is enabled. Both listeners forward to the
		// same targets; nothing redirects, which avoids Cloudflare redirect loops.
		const targetGroup = alb.addListener('Http', { port: 80 }).addTargets('AppHttp', {
			port: 8080,
			targets: [service],
			deregistrationDelay: cdk.Duration.seconds(10),
			healthCheck: {
				path: '/api/health',
				healthyHttpCodes: '200',
				// Two failed checks ten seconds apart mark a task unhealthy, which is
				// what keeps the rollback drill inside about a minute.
				interval: cdk.Duration.seconds(10),
				timeout: cdk.Duration.seconds(5),
				healthyThresholdCount: 2,
				unhealthyThresholdCount: 2,
			},
		});

		if (props.certificateArn) {
			alb.addListener('Https', {
				port: 443,
				certificates: [
					acm.Certificate.fromCertificateArn(this, 'Certificate', props.certificateArn),
				],
			}).addTargetGroups('AppHttps', { targetGroups: [targetGroup] });
		}

		const alarmTopic = new sns.Topic(this, 'Alarms', {
			displayName: `${SSR_NAME} alarms`,
		});

		if (props.alarmEmail) {
			new sns.Subscription(this, 'AlarmEmail', {
				topic: alarmTopic,
				protocol: sns.SubscriptionProtocol.EMAIL,
				endpoint: props.alarmEmail,
			});
		}

		const unhealthyAlarm = new cloudwatch.Alarm(this, 'UnhealthyTargets', {
			alarmDescription: 'An SSR task is failing the /api/health check.',
			metric: targetGroup.metrics.unhealthyHostCount({
				period: cdk.Duration.minutes(1),
				statistic: 'Maximum',
			}),
			threshold: 1,
			comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
			evaluationPeriods: 1,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});
		unhealthyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

		const errorAlarm = new cloudwatch.Alarm(this, 'Target5xx', {
			alarmDescription: 'The SSR targets answered with 5XX responses.',
			metric: targetGroup.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT, {
				period: cdk.Duration.minutes(1),
				statistic: 'Sum',
			}),
			threshold: 1,
			comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
			evaluationPeriods: 1,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});
		errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));

		// GitHub Actions assumes this role over OIDC, so no AWS keys live in GitHub.
		const githubRepository = props.githubRepository ?? 'DandarGaming/cs4421-astro-blog';
		const githubBranch = props.githubBranch ?? 'main';
		const immutableGitHubRepository =
			githubRepository === 'DandarGaming/cs4421-astro-blog'
				? 'DandarGaming@103852756/cs4421-astro-blog@1362457966'
				: undefined;

		const provider = props.githubOidcProviderArn
			? iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(
					this,
					'GitHubOidc',
					props.githubOidcProviderArn,
				)
			: new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
					url: 'https://token.actions.githubusercontent.com',
					clientIds: ['sts.amazonaws.com'],
				});

		const deployRole = new iam.Role(this, 'GitHubDeployRole', {
			roleName: `${SSR_NAME}-github-deploy`,
			description: 'Assumed by GitHub Actions to push SSR images and roll out ECS deployments.',
			assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
				StringEquals: {
					'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
				},
				StringLike: {
					'token.actions.githubusercontent.com:sub': [
						// Keep the legacy subject for repositories that still use it.
						`repo:${githubRepository}:ref:refs/heads/${githubBranch}`,
						// GitHub now uses immutable-ID subjects for this repository.
						...(immutableGitHubRepository
							? [
								`repo:${immutableGitHubRepository}:ref:refs/heads/${githubBranch}`,
							]
							: []),
					],
				},
			}),
			maxSessionDuration: cdk.Duration.hours(1),
		});

		// grantPullPush also grants ecr:GetAuthorizationToken on *, which `docker
		// login` needs before it can push the image.
		props.repository.grantPullPush(deployRole);

		deployRole.addToPolicy(
			new iam.PolicyStatement({
				sid: 'RegisterTaskDefinition',
				actions: [
					'ecs:RegisterTaskDefinition',
					'ecs:DeregisterTaskDefinition',
					'ecs:DescribeTaskDefinition',
				],
				resources: ['*'],
			}),
		);

		deployRole.addToPolicy(
			new iam.PolicyStatement({
				sid: 'UpdateService',
				actions: ['ecs:UpdateService', 'ecs:DescribeServices'],
				resources: [service.serviceArn],
			}),
		);

		deployRole.addToPolicy(
			new iam.PolicyStatement({
				sid: 'ObserveDeployment',
				actions: ['ecs:ListTasks', 'ecs:DescribeTasks', 'ecs:DescribeClusters'],
				resources: ['*'],
			}),
		);

		deployRole.addToPolicy(
			new iam.PolicyStatement({
				sid: 'PassTaskRoles',
				actions: ['iam:PassRole'],
				resources: [taskDefinition.taskRole.roleArn, taskDefinition.executionRole!.roleArn],
				conditions: {
					StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' },
				},
			}),
		);

		logGroup.grantRead(deployRole);
		logGroup.grant(deployRole, 'logs:StartQuery', 'logs:GetQueryResults');

		new cdk.CfnOutput(this, 'LoadBalancerUrl', {
			value: `http://${alb.loadBalancerDnsName}`,
			description: 'SSR site through the load balancer DNS name (no custom DNS).',
		});

		new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
			value: alb.loadBalancerDnsName,
			description: `CNAME target for ${props.hostname}.`,
		});

		new cdk.CfnOutput(this, 'CustomDomainUrl', {
			value: `https://${props.hostname}`,
			description: 'SSR site through the custom DNS record (Cloudflare proxy in front).',
		});

		new cdk.CfnOutput(this, 'LogGroupName', { value: logGroup.logGroupName });
		new cdk.CfnOutput(this, 'DeployRoleArn', {
			value: deployRole.roleArn,
			description: 'Set this as the AWS_DEPLOY_ROLE_ARN repository variable in GitHub.',
		});
		new cdk.CfnOutput(this, 'AlarmTopicArn', { value: alarmTopic.topicArn });
		new cdk.CfnOutput(this, 'ClusterName', { value: cluster.clusterName });
		new cdk.CfnOutput(this, 'ServiceName', { value: service.serviceName });
		new cdk.CfnOutput(this, 'TaskDefinitionFamily', { value: taskDefinition.family });
	}
}
