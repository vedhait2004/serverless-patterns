import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { Cluster, ContainerImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Topic } from 'aws-cdk-lib/aws-sns';
import path = require('path');

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const topic = new Topic(this, 'Topic', {
      displayName: 'demo topic',
      topicName: 'demoTopic',
    });

    const vpc = new Vpc(this, 'Vpc', {
      maxAzs: 3,
    });

    const cluster = new Cluster(this, 'Cluster', {
      vpc: vpc,
    });

    const fargate = new ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster: cluster,
      cpu: 512,
      desiredCount: 1,
      taskImageOptions: {
        image: ContainerImage.fromAsset(path.join(__dirname, '../src/')),
        environment: {
          topicArn: topic.topicArn,
          region: process.env.CDK_DEFAULT_REGION!,
        },
      },
      assignPublicIp: false,
      memoryLimitMiB: 2048,
    });

    // Write permissions to SNS topic for Fargate
    topic.grantPublish(fargate.taskDefinition.taskRole);
  }
}
