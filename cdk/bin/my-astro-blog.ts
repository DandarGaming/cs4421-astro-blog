#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DeploymentPipelineStack } from '../lib/deployment-pipeline-stack.js';

const app = new cdk.App();
const connectionArn = process.env.GITHUB_CONNECTION_ARN;
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

if (!connectionArn) {
	throw new Error(
		'Set GITHUB_CONNECTION_ARN to the ARN of an authorized AWS CodeStar connection to GitHub.',
	);
}

if (!account || !region) {
	throw new Error(
		'Set CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION by configuring AWS credentials and a default region.',
	);
}

new DeploymentPipelineStack(app, 'AstroBlogPipelineStack', connectionArn, {
	env: { account, region },
});
