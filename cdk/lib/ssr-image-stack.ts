import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

/**
 * Name shared by the repository, the ECS cluster/service and the task family.
 * .github/workflows/deploy-container.yml and scripts/rollback.sh use the same
 * names, so keep the three constants in sync if you rename anything.
 */
export const SSR_NAME = 'astro-ssr';

/**
 * The repository is its own stack so it can be created before the ECS service:
 * the service's first task needs an image to pull, and the image can only be
 * pushed once the repository exists.
 */
export class SsrImageStack extends cdk.Stack {
	public readonly repository: ecr.Repository;

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		this.repository = new ecr.Repository(this, 'Repository', {
			repositoryName: SSR_NAME,
			imageScanOnPush: true,
			emptyOnDelete: true,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			lifecycleRules: [
				{ description: 'Keep the twenty most recent images', maxImageCount: 20, rulePriority: 1 },
			],
		});

		new cdk.CfnOutput(this, 'RepositoryUri', {
			value: this.repository.repositoryUri,
			description: 'Push SSR images here: <uri>:sha-<commit> and <uri>:stable.',
		});

		new cdk.CfnOutput(this, 'RepositoryName', {
			value: this.repository.repositoryName,
		});
	}
}
