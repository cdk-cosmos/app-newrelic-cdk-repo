import { StackProps } from '@aws-cdk/core';
import { Key } from '@aws-cdk/aws-kms';
import { GalaxyExtensionStack } from '@cdk-cosmos/core';
import { AppCosmosStack } from '.';

export class AppGalaxyStack extends GalaxyExtensionStack {
  readonly cosmos: AppCosmosStack;
  readonly sharedKey: Key;

  constructor(cosmos: AppCosmosStack, id: string, props?: StackProps) {
    super(cosmos, id, props);

    this.sharedKey = new Key(this, 'SharedKey', {
      enableKeyRotation: true,
      trustAccountIdentities: true,
    });
  }
}
