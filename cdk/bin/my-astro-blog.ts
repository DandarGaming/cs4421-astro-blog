#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/static-site-stack.js';

const app = new cdk.App();
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;

if (!account || !region) {
	throw new Error(
		'Set CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION by configuring AWS credentials and a default region.',
	);
}

new StaticSiteStack(app, 'StaticSiteStack', {
	env: { account, region },
});
