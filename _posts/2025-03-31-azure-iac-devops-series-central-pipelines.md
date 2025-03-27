---
layout: post
title: "DevOps and Azure IaC Series: Centralised Pipelines"
date: 2025-03-25 09:30:00 +1100
categories: [DevOps, Azure IaC]
tags: [azure, deploy, devops, iac, ci/cd]
image: /assets/img/posts/2025-03-31-devops-iac-series-central-pipelines/feature_image.png
mermaid: true
---

## DevOps and Azure IaC Series: Centralised Pipelines

Welcome back to our DevOps and Azure IaC series! In our previous article, we delved into the Deploy phase, exploring effective approaches for deploying infrastructure using DevOps and Azure IaC. Today, we'll focus on a crucial aspect of DevOps practices: centralised pipelines. These standardised workflows can significantly enhance your team's efficiency, consistency, and governance when managing infrastructure as code.

## What are Centralised Pipelines?

Centralised pipelines are reusable CI/CD workflows that standardise your build, validation, and deployment processes across multiple projects or teams. Rather than having each team create their own unique pipelines, centralised pipelines establish a consistent approach that can be leveraged across your organisation. This is particularly valuable for infrastructure as code, where consistency and standardisation are essential for maintaining security and compliance.

Overview of centralised pipelines:

```mermaid
flowchart LR
    subgraph "Central Pipeline Repository"
        direction LR
        CP[Central Pipelines]
        CP --> |Contains| B[Build Templates]
        CP --> |Contains| V[Validation Templates]
        CP --> |Contains| D[Deployment Templates]
    end

    subgraph "Team Projects"
        P1[Project 1 Repository]
        P2[Project 2 Repository]
        P3[Project 3 Repository]
        P4[Project 4 Repository]
    end

    CP --> |Referenced by| P1
    CP --> |Referenced by| P2
    CP --> |Referenced by| P3
    CP --> |Referenced by| P4

    classDef central fill:#00796b,stroke:#000,stroke-width:2px
    classDef projects fill:#0d47a1,color:#fff, stroke:#000,stroke-width:2px
    class CP,B,V,D central
    class P1,P2,P3,P4 projects
```

## Benefits of Centralised Pipelines

Centralised pipelines offer several key benefits for managing infrastructure as code:

- **Consistency and Standardisation:** Centralised pipelines enforce uniform infrastructure deployment practices across all teams. This standardisation prevents inconsistencies and reduces the risk of human error in pipeline setup.

- **Reduced Maintenance Overhead:** With centralised pipelines, you only need to update and maintain one set of workflows rather than updating numerous similar pipelines across projects. When security requirements change or new best practices emerge, you can implement these changes in one place.

- **Built-in Governance:** Centralised pipelines allow you to embed governance controls directly into your deployment processes. These controls can include:

  - Mandatory security scans
  - Policy compliance checks
  - Approval workflows
  - Audit logging
  - Cost management validations

- **Knowledge Sharing:** Centralised pipelines document your organisation's best practices in code, making it easier for new team members to understand deployment standards and quickly become productive.

Illustrating the benefits of centralised pipelines:

```mermaid
graph TD
    subgraph "Traditional Approach"
    direction TB
        T1[Team 1 Pipeline] --> TM1[Maintenance]
        T2[Team 2 Pipeline] --> TM2[Maintenance]
        T3[Team 3 Pipeline] --> TM3[Maintenance]
        T4[Team 4 Pipeline] --> TM4[Maintenance]
    end

    classDef traditional fill:#ff6f00,color:#fff, stroke:#000,stroke-width:2px
    class T1,T2,T3,T4,TM1,TM2,TM3,TM4 traditional
```

```mermaid
graph TD
    subgraph "Centralised Approach"
    direction LR
        CP[Centralised Pipeline Repository]
        CP --> CM[Single Maintenance Point]
        CP --> |Used by| TP1[Team 1 Project]
        CP --> |Used by| TP2[Team 2 Project]
        CP --> |Used by| TP3[Team 3 Project]
        CP --> |Used by| TP4[Team 4 Project]
    end

    classDef centralised fill:#c62828,color:#fff, stroke:#000,stroke-width:2px
    class CP,CM,TP1,TP2,TP3,TP4 centralised
```

## Implementing Centralised Pipelines in GitHub

The example below demonstrates how to implement centralised pipelines using GitHub's reusable workflows feature. This approach allows you to define core workflows that can be called from individual repositories.

This has been illustrated in the following diagram:

```mermaid
flowchart TD
  subgraph "Central Repository"
    CW[Central Workflows]
    CW --> |Contains| BW[build.yml]
    CW --> |Contains| DW[deploy.yml]
    CW --> |Contains| VW[validate.yml]
  end

  subgraph "Project Repository"
    PW[Project Workflow]
    PW --> |References| BW
    PW --> |References| DW
    PW --> |References| VW
    PW --> |Contains| IC[Infrastructure Code]
  end

  GH[GitHub Actions] --> |Executes| PW
  PW --> |Triggers| E[Execution]
  E --> |Uses| CW

  classDef central fill:#00796b,color:#fff,stroke:#000,stroke-width:2px
  classDef project fill:#0d47a1,color:#fff, stroke:#000,stroke-width:2px
  classDef execution fill:#388e3c,color:#fff,stroke:#000,stroke-width:2px
  class CW,BW,DW,VW central
  class PW,IC project
  class GH,E execution
```

Code snippets for implementing centralised pipelines in GitHub:

### Centralised Pipeline Reusable Workflow

Here is an example of a centralised pipeline reusable workflow that deploys a Bicep template:

```yaml
{% raw %}
# Main reusable workflow in central repository
name: Central Deploy Pipeline

on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string
      location:
        required: true
        type: string
      subscription_id:
        required: true
        type: string
      management_group_id:
        required: false
        type: string
      template_file_name:
        required: true
        type: string
      deployment_name:
        required: true
        type: string
    secrets:
      AZURE_CREDENTIALS:
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: bicep-templates

      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy Bicep Template
        uses: azure/arm-deploy@v1
        with:
          scope: ${{ inputs.management_group_id != '' && 'managementgroup' || 'subscription' }}
          managementGroupId: ${{ inputs.management_group_id }}
          subscriptionId: ${{ inputs.subscription_id }}
          region: ${{ inputs.location }}
          template: ${{ inputs.template_file_name }}
          deploymentName: ${{ inputs.deployment_name }}
{% endraw %}
```

### Calling Centralised Pipelines

Individual repositories can then call these centralised pipelines, providing only the required parameters:

```yaml
{% raw %}
name: Infrastructure Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    uses: your-org/central-pipelines/.github/workflows/build.yml@main
    with:
      template_path: ./bicep/main.bicep

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    uses: your-org/central-pipelines/.github/workflows/deploy.yml@main
    with:
      environment: production
      location: eastus
      subscription_id: ${{ vars.SUBSCRIPTION_ID }}
      template_file_name: main.bicep
      deployment_name: iac-deployment-${{ github.run_id }}
    secrets:
      AZURE_CREDENTIALS: ${{ secrets.AZURE_CREDENTIALS }}
{% endraw %}
```

## Implementing Centralised Pipelines in Azure DevOps

The example below demonstrates how to implement centralised pipelines using Azure DevOps's pipeline template feature. This approach allows you to define core workflows that can be called from individual repositories.

This has been illustrated in the following diagram:

```mermaid
flowchart TD
  subgraph "Central Template Repository"
    CT[Central Templates]
    CT --> |Contains| BT[bicep-build.yml]
    CT --> |Contains| DT[bicep-deploy.yml]
    CT --> |Contains| VT[bicep-validate.yml]
  end

  subgraph "Project Repository"
    PP[azure-pipelines.yml]
    PP --> |References| BT
    PP --> |References| DT
    PP --> |Contains| IC[Infrastructure Code]
  end

  AD[Azure DevOps] --> |Executes| PP
  PP --> |Triggers| E[Execution]
  E --> |Uses| CT

  classDef central fill:#00796b,color:#fff,stroke:#000,stroke-width:2px
  classDef project fill:#0d47a1,color:#fff, stroke:#000,stroke-width:2px
  classDef execution fill:#388e3c,color:#fff,stroke:#000,stroke-width:2px
  class CT,BT,DT,VT central
  class PP,IC project
  class AD,E execution
```

### Centralised Pipeline Template

Here's an example of a reusable template for deploying Bicep files.

```yaml
{% raw %}
# bicep-deploy.yml template in the central repository
parameters:
  environment: ''
  location: ''
  subscriptionId: ''
  managementGroupId: ''
  templateFilePath: ''
  deploymentName: ''
  serviceConnection: ''

steps:
- task: AzureCLI@2
  displayName: 'Deploy Bicep Template'
  inputs:
    azureSubscription: ${{ parameters.serviceConnection }}
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: |
      # Use management group or subscription scope based on parameter
      if [ -z "${{ parameters.managementGroupId }}" ]; then
        az account set --subscription ${{ parameters.subscriptionId }}
        az deployment sub create \
          --location ${{ parameters.location }} \
          --template-file ${{ parameters.templateFilePath }} \
          --name ${{ parameters.deploymentName }}
      else
        az deployment mg create \
          --management-group ${{ parameters.managementGroupId }} \
          --location ${{ parameters.location }} \
          --template-file ${{ parameters.templateFilePath }} \
          --name ${{ parameters.deploymentName }}
      fi
{% endraw %}
```

### Using Templates in Azure DevOps Pipelines

Here's how to reference and use the template from a project pipeline:

```yaml
{% raw %}
# azure-pipelines.yml in a project repository
trigger:
  - main

resources:
  repositories:
    - repository: templates
      type: git
      name: CentralPipelines
      ref: refs/tags/v1.0.0

variables:
  - template: variable-templates/dev-variables.yml@templates
  - name: deploymentName
    value: 'bicep-deployment-$(Build.BuildId)'

stages:
- stage: Build
  jobs:
  - job: BuildBicep
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - template: templates/bicep-build.yml@templates
      parameters:
        bicepFilePath: './infra/main.bicep'

- stage: Deploy
  dependsOn: Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployInfrastructure
    environment: $(environmentName)
    pool:
      vmImage: 'ubuntu-latest'
    strategy:
      runOnce:
        deploy:
          steps:
          - template: templates/bicep-deploy.yml@templates
            parameters:
              serviceConnection: '$(serviceConnectionName)'
              subscriptionId: '$(subscriptionId)'
              location: '$(location)'
              templateFilePath: '$(Pipeline.Workspace)/bicep/main.bicep'
              deploymentName: '$(deploymentName)'
{% endraw %}
```

## Building a Central Pipeline Repository

To effectively implement centralised pipelines, create a dedicated repository that contains:

1. Central Pipelines: Core pipeline definitions for common tasks like build, validation, and deployment.
2. Documentation: Clear guidelines explaining how to use the pipelines and their requirements.
3. Templates: Sample implementation templates to help teams get started quickly.
4. Validation Scripts: Common validation tools and scripts that enforce best practices.

```mermaid
graph LR
  R[Central Repository] --> W[workflows/]
  R --> D[docs/]
  R --> E[examples/]
  R --> S[scripts/]

  W --> B[build/]
  W --> V[validate/]
  W --> DP[deploy/]

  B --> |Contains| BG[build.github.yml]
  B --> |Contains| BA[build.azuredevops.yml]

  V --> |Contains| VS[security-scan.yml]
  V --> |Contains| VP[lint-check.yml]

  DP --> |Contains| DM[deploy.github.sub.yml]
  DP --> |Contains| DS[deploy.azuredevops.sub.yml]

  D --> |Contains| RD[README.md]
  D --> |Contains| CM[CONTRIBUTING.md]

  E --> |Contains| EG[github-example.yml]
  E --> |Contains| EA[azuredevops-example.yml]

  S --> |Contains| SV[version-check.sh]
  S --> |Contains| SS[security-scan.sh]

  classDef folder fill:#b71c1c,color:#fff,stroke:#333,stroke-width:1px
  classDef file fill:#424242,color:#fff,stroke:#333,stroke-width:1px
  class R,W,D,E,S,B,V,DP folder
  class BG,BA,VS,VP,DM,DS,DR,RD,UD,CM,EG,EA,SV,SS file
```

## Pipeline Versioning Strategy

When implementing centralised pipelines, it's important to establish a versioning strategy. This allows teams to adopt updates on their own schedule while ensuring stability. Consider these approaches:

1. Semantic Versioning: Tag your pipeline releases (v1.0.0, v1.1.0, etc.) and allow teams to reference specific versions.
2. Branch-Based: Create stable branches (main, release, etc.) that teams can reference.
3. Immutable Tags: Use immutable tags for major versions to prevent breaking changes.

```mermaid
graph LR
  subgraph "Semantic Versioning"
    V["Central Repo"] --> V1["v1.0.0"]
    V --> V11["v1.1.0"]
    V --> V2["v2.0.0"]

    P1["Project A"] --> V1
    P2["Project B"] --> V11
    P3["Project C"] --> V2
  end

  subgraph "Branch-based Strategy"
    M["Main Branch"]
    D["Development Branch"]
    R["Release Branch"]

    D --> |"Merge when stable"| M
    M --> |"Create for release"| R

    PD["Test Project"] --> D
    PM["Prod Project A"] --> M
    PR["Prod Project B"] --> R
  end

  classDef version fill:#81D4FA,color:#fff,stroke:#333,stroke-width:1px
  classDef branch fill:#A5D6A7,color:#fff,stroke:#333,stroke-width:1px
  classDef project fill:#FFB74D,color:#fff,stroke:#333,stroke-width:1px
  class V,V1,V11,V2 version
  class M,D,R branch
  class P1,P2,P3,PD,PM,PR project
```

## Change Management

Centralised pipelines require careful change management to avoid disrupting teams who depend on them:

1. Announce Changes: Communicate upcoming changes well in advance.
2. Breaking vs. Non-Breaking: Clearly distinguish between breaking and non-breaking changes.
3. Testing: Thoroughly test changes before releasing them.
4. Migration Guides: Provide documentation to help teams adopt new versions.

```mermaid
graph TD
  PR[Propose Change PR] --> TS[Test in Staging]
  TS --> |"Fails"| PR
  TS --> |"Passes"| A[Announce Changes]
  A --> |"Major Change"| MC[New Major Version]
  A --> |"Minor Change"| NC[New Minor Version]

  MC --> DM[Documentation & Migration Guide]
  NC --> DM

  DM --> RT[Release Tags]
  RT --> |"Teams adopt when ready"| T1[Team 1 Adopts]
  RT --> |"Teams adopt when ready"| T2[Team 2 Adopts]
  RT --> |"Teams adopt when ready"| T3[Team 3 Adopts]

  classDef change fill:#795548,color:#fff,stroke:#333,stroke-width:1px
  classDef test fill:#00695c,color:#fff,stroke:#333,stroke-width:1px
  classDef doc fill:#6a1b9a,color:#fff,stroke:#333,stroke-width:1px
  classDef teams fill:#33691e,color:#fff,stroke:#333,stroke-width:1px
  class PR,A,MC,NC change
  class TS test
  class DM,RT doc
  class T1,T2,T3 teams
```

Check out the repository for this series to see how these concepts come to life and integrate them into your workflows.

## Conclusion

Centralised pipelines are a powerful tool for standardising and scaling your infrastructure as code practices across teams. By implementing these shared workflows, you can enforce governance, reduce maintenance overhead, and accelerate onboarding while maintaining consistency in your deployments.

In our next post, we'll explore how to integrate security scanning and policy validation into your centralised pipelines to further enhance your governance posture. Stay tuned!

For practical examples and implementation guidance, check out the [X repository](https://github.com/tw3lveparsecs/azure-iac-and-devops/blob/main/.github/workflows/deploy_template.yml), which contains both GitHub reusable workflows and Azure DevOps templates for Azure IaC deployments.
