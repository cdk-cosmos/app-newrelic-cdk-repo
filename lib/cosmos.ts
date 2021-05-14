import { Construct, StackProps } from '@aws-cdk/core';
import { Repository as EcrRepository } from '@aws-cdk/aws-ecr';
import { CosmosExtensionStack, CosmosExtensionStackProps } from '@cdk-cosmos/core';

export interface AppCosmosStackProps extends CosmosExtensionStackProps {
  awsAccountName: string;
}

export class AppCosmosStack extends CosmosExtensionStack {
  readonly awsAccountName: string;
  readonly ecrRepo: EcrRepository;

  constructor(scope: Construct, id: string, props: AppCosmosStackProps) {
    super(scope, id, props);

    this.awsAccountName = props.awsAccountName;

    this.ecrRepo = new EcrRepository(this, 'EcrRepo', {
      repositoryName: this.nodeId('Agent', '/').toLowerCase(),
    });
  }
}
