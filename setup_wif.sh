#!/bin/bash
set -e

PROJECT_ID="babelforge-preview-13196"
PROJECT_NUMBER="604640402182"
SA_NAME="github-actions-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
POOL_NAME="github-actions-pool"
PROVIDER_NAME="github-actions-provider"
REPO="nasakib/babelForgePreview"

echo "Enabling required APIs..."
gcloud services enable iam.googleapis.com cloudresourcemanager.googleapis.com iamcredentials.googleapis.com sts.googleapis.com run.googleapis.com artifactregistry.googleapis.com compute.googleapis.com storage-component.googleapis.com --project="${PROJECT_ID}"

echo "Creating Service Account..."
gcloud iam service-accounts create "${SA_NAME}" \
  --project="${PROJECT_ID}" \
  --display-name="GitHub Actions Deployment SA" || true

echo "Assigning roles to Service Account..."
ROLES=(
  "roles/run.admin"
  "roles/storage.admin"
  "roles/artifactregistry.admin"
  "roles/iam.serviceAccountUser"
  "roles/firebase.admin"
)
for role in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="${role}" \
    --condition=None
done

echo "Creating Workload Identity Pool..."
gcloud iam workload-identity-pools create "${POOL_NAME}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool" || true

echo "Creating Workload Identity Provider..."
gcloud iam workload-identity-pools providers create-oidc "${PROVIDER_NAME}" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="${POOL_NAME}" \
  --display-name="GitHub Actions Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com" || true

echo "Binding IAM Policy for WIF..."
gcloud iam service-accounts add-iam-policy-binding "${SA_EMAIL}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${REPO}"

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/providers/${PROVIDER_NAME}"

echo "Setting GitHub Secrets..."
gh secret set GCP_PROJECT_ID --body "${PROJECT_ID}"
gh secret set WIF_PROVIDER --body "${WIF_PROVIDER}"
gh secret set WIF_SERVICE_ACCOUNT --body "${SA_EMAIL}"

echo "Done!"
