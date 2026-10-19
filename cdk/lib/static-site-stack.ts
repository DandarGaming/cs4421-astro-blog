import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'node:path';

export class StaticSiteStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const siteBucket = new s3.Bucket(this, 'SiteBucket', {
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
		});

		const routeRewrite = new cloudfront.Function(this, 'RouteRewrite', {
			code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
	var request = event.request;
	var uri = request.uri;

	if (uri.indexOf('/api/') === 0) {
		return request;
	}

	var fileName = uri.substring(uri.lastIndexOf('/') + 1);

	if (fileName.indexOf('.') === -1) {
		request.uri =
			uri.charAt(uri.length - 1) === '/' ? uri + 'index.html' : uri + '/index.html';
	}

	return request;
}`),
		});

		const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
			defaultBehavior: {
				origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
				functionAssociations: [
					{
						eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
						function: routeRewrite,
					},
				],
			},
			defaultRootObject: 'index.html',
			errorResponses: [403, 404].map((httpStatus) => ({
				httpStatus,
				responseHttpStatus: 404,
				responsePagePath: '/404.html',
				ttl: cdk.Duration.minutes(5),
			})),
		});

		new cdk.CfnOutput(this, 'SiteBucketName', {
			value: siteBucket.bucketName,
		});
		new cdk.CfnOutput(this, 'SiteDistributionId', {
			value: distribution.distributionId,
		});

		new s3deploy.BucketDeployment(this, 'DeploySite', {
			sources: [s3deploy.Source.asset(path.resolve(__dirname, '../../dist'))],
			destinationBucket: siteBucket,
			distribution,
			distributionPaths: ['/*'],
		});
	}
}
