import { Stack } from '@aws-cdk/core';
import { SolarSystemExtensionStack, SolarSystemExtensionStackProps, CiCdFeatureExtensionStack } from '@cdk-cosmos/core';
import { DockerPipeline } from '@cosmos-building-blocks/pipeline';
import { AppGalaxyStack } from '.';

export class AppCiCdSolarSystemStack extends SolarSystemExtensionStack {
  readonly galaxy: AppGalaxyStack;
  readonly ciCd: CiCdFeatureExtensionStack;
  readonly codePipeline: DockerPipeline;

  constructor(galaxy: AppGalaxyStack, props?: SolarSystemExtensionStackProps) {
    super(galaxy, 'CiCd', {
      portalProps: {
        vpcProps: {
          aZsLookup: true,
        },
      },
      ...props,
    });

    this.addCiCd();

    const { ecrRepo } = this.galaxy.cosmos;
    const { cdkRepo } = this.ciCd;

    this.codePipeline = new DockerPipeline(this, 'CodePipeline', {
      pipelineName: this.galaxy.cosmos.nodeId('Code-Pipeline', '-'),
      buildName: this.galaxy.cosmos.nodeId('Code-Build', '-'),
      codeRepo: cdkRepo,
      codeTrigger: false,
      buildSpec: DockerPipeline.DefaultBuildSpec(),
      buildEnvs: {
        ECR_URL: {
          value: ecrRepo.repositoryUri,
        },
      },
    });

    ecrRepo.grantPullPush(this.codePipeline.build);
  }

  addCdkDeployEnvStageToCodePipeline(props: { name: string; stacks: Stack[]; isManualApprovalRequired?: boolean }) {
    this.ciCd.addDeployStackStage({
      ...props,
      pipeline: this.codePipeline.pipeline,
      envs: DockerPipeline.DefaultAppBuildVersionStageEnv(),
    });
  }
}
