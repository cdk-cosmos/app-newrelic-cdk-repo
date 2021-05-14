import { IRole } from '@aws-cdk/aws-iam';
import { Key } from '@aws-cdk/aws-kms';
import { Repository } from '@aws-cdk/aws-ecr';
import { ContainerImage, NetworkMode, Secret } from '@aws-cdk/aws-ecs';
import { Secret as KmsSecret } from '@aws-cdk/aws-secretsmanager';
import { SolarSystemExtensionStack, SolarSystemExtensionStackProps } from '@cdk-cosmos/core';
import { SsmState } from '@cosmos-building-blocks/common';
import { EcsService } from '@cosmos-building-blocks/service';
import { AppGalaxyStack } from '.';

export interface AppSolarSystemProps extends SolarSystemExtensionStackProps {
  agentVersion?: string;
}

export class AppSolarSystemStack extends SolarSystemExtensionStack {
  readonly galaxy: AppGalaxyStack;

  constructor(galaxy: AppGalaxyStack, id: string, props?: AppSolarSystemProps) {
    super(galaxy, id, {
      portalProps: {
        vpcProps: {
          aZsLookup: true,
        },
      },
      ...props,
    });

    const { agentVersion } = props || {};
    const { ecrRepo } = this.galaxy.cosmos;
    const { vpc } = this.portal;
    const { cluster } = this.portal.addEcs();

    const ecrRepoClone = Repository.fromRepositoryAttributes(this, 'EcrRepo', ecrRepo); // Scope issue
    const versionState = new SsmState(this, 'VersionState', {
      name: '/' + this.nodeId('VersionState', '/'),
      value: agentVersion,
    });
    const secret = new KmsSecret(this, 'LicenceKey', {
      encryptionKey: Key.fromKeyArn(this, 'Key', this.galaxy.sharedKey.keyArn),
    });

    const service = new EcsService(this, 'NewRelicAgent', {
      vpc,
      cluster,
      serviceProps: {
        daemon: true,
        desiredCount: undefined,
        placementConstraints: undefined,
        placementStrategies: undefined,
      },
      taskProps: {
        networkMode: NetworkMode.HOST,
      },
      containerProps: {
        image: ContainerImage.fromEcrRepository(ecrRepoClone, versionState.value),
        privileged: true,
        secrets: {
          NRIA_LICENSE_KEY: Secret.fromSecretsManager(secret),
        },
        environment: {
          // https://docs.newrelic.com/docs/infrastructure/install-infrastructure-agent/configuration/infrastructure-agent-configuration-settings/
          NRIA_OVERRIDE_HOST_ROOT: '/host',
          NRIA_PASSTHROUGH_ENVIRONMENT: 'ECS_CONTAINER_METADATA_URI,ENABLE_NRI_ECS',
          ENABLE_NRI_ECS: 'true',
          NRIA_VERBOSE: '0',
          NRIA_CUSTOM_ATTRIBUTES: JSON.stringify({
            awsAccountName: this.galaxy.cosmos.awsAccountName,
            awsEnvironment: this.node.id,
            nrDeployMethod: 'cloudFormation',
          }),
        },
      },
    });

    service.taskDefinition.addVolume({
      name: 'Docker',
      host: { sourcePath: '/var/run/docker.sock' },
    });
    service.taskDefinition.addVolume({
      name: 'Host',
      host: { sourcePath: '/' },
    });

    service.container.addMountPoints({
      sourceVolume: 'Docker',
      containerPath: '/var/run/docker.sock',
      readOnly: false,
    });
    service.container.addMountPoints({
      sourceVolume: 'Host',
      containerPath: '/host',
      readOnly: true,
    });

    this.galaxy.sharedKey.grantDecrypt(service.taskDefinition.executionRole as IRole);
  }
}
