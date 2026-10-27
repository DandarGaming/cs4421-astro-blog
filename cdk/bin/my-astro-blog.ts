#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DeploymentPipelineStack } from '../lib/deployment-pipeline-stack.js';
import { SsrImageStack } from '../lib/ssr-image-stack.js';
import { SsrSiteStack } from '../lib/ssr-site-stack.js';

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

// The SSR stacks create a VPC, and every VPC construct asks CDK for the
// region's availability zones. Supplying them here keeps synthesis offline and
// deterministic instead of requiring a describeAvailabilityZones call.
app.node.setContext(`availability-zones:account=${account}:region=${region}`, [
	`${region}a`,
	`${region}b`,
]);

new DeploymentPipelineStack(app, 'AstroBlogPipelineStack', connectionArn, {
	env: { account, region },
});

// The server-rendered stacks are deployed on their own so the static pipeline
// never waits on a Docker build. Deploy them in this order:
//   1. SSR_HOSTNAME=app.danielsukhanov.me npx cdk deploy SsrImageStack
//   2. push an image tagged `stable` to the repository
//   3. SSR_HOSTNAME=app.danielsukhanov.me npx cdk deploy SsrSiteStack
// SsrSiteStack depends on SsrImageStack, so a later deploy of just SsrSiteStack
// brings the image stack along if it is still missing.
const ssrHostname = process.env.SSR_HOSTNAME;

if (ssrHostname) {
	const imageStack = new SsrImageStack(app, 'SsrImageStack', {
		env: { account, region },
	});

	new SsrSiteStack(app, 'SsrSiteStack', {
		env: { account, region },
		hostname: ssrHostname,
		repository: imageStack.repository,
		imageTag: process.env.SSR_IMAGE_TAG,
		certificateArn: process.env.SSR_CERTIFICATE_ARN,
		supabaseUrl: process.env.SUPABASE_URL,
		supabaseKey: process.env.SUPABASE_KEY,
		githubOidcProviderArn:
			process.env.GITHUB_OIDC_PROVIDER_ARN ??
			`arn:aws:iam::${account}:oidc-provider/token.actions.githubusercontent.com`,
		alarmEmail: process.env.ALARM_EMAIL,
	});
}
