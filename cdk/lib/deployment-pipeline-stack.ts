import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { StaticSiteStack } from './static-site-stack.js';

export class StaticSiteStage extends cdk.Stage {
	constructor(scope: Construct, id: string, props?: cdk.StageProps) {
		super(scope, id, props);

		new StaticSiteStack(this, 'StaticSiteStack', {
			stackName: 'StaticSiteStack',
		});
	}
}

export class DeploymentPipelineStack extends cdk.Stack {
	constructor(
		scope: Construct,
		id: string,
		connectionArn: string,
		props?: cdk.StackProps,
	) {
		super(scope, id, props);

		const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
			pipelineName: 'AstroBlogDeployment',
			pipelineType: codepipeline.PipelineType.V1,
			synth: new pipelines.CodeBuildStep('Synth', {
				input: pipelines.CodePipelineSource.connection(
					'dandargaming/cs4421-astro-blog',
					'main',
					{ connectionArn },
				),
				commands: [
					'npm ci',
					'npm run build',
					'cd cdk && npm ci && npm run build && npx cdk synth',
				],
				primaryOutputDirectory: 'cdk/cdk.out',
				env: {
					GITHUB_CONNECTION_ARN: connectionArn,
					CDK_DEFAULT_ACCOUNT: this.account,
					CDK_DEFAULT_REGION: this.region,
				},
				partialBuildSpec: codebuild.BuildSpec.fromObject({
					version: '0.2',
					phases: {
						install: {
							'runtime-versions': { nodejs: '22' },
						},
					},
				}),
				buildEnvironment: {
					buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
				},
			}),
		});

		pipeline.addStage(
			new StaticSiteStage(this, 'Production', {
				env: { account: this.account, region: this.region },
			}),
		);
	}
}
