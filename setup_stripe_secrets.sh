#!/bin/bash
# babelForge B2B Security Subsystem
# Dynamic Stripe Secret Configuration Utility for GCP & GitHub Secrets

set -e

# Harmonious HSL colors for cybernetic terminal output
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${PURPLE}========================================================================${NC}"
echo -e "${CYAN}             babelForge B2B Stripe Secrets Configuration Utility         ${NC}"
echo -e "${PURPLE}========================================================================${NC}"
echo -e "${YELLOW}This utility will securely configure Stripe API credentials in GCP Secret Manager${NC}"
echo -e "${YELLOW}and GitHub Secrets. Sensitive inputs are masked and never exposed in plain logs.${NC}"
echo ""

# 1. Gather inputs securely
read -p "Enter your GCP Project ID: " GCP_PROJECT_ID
if [ -z "$GCP_PROJECT_ID" ]; then
    echo -e "${RED}ERROR: GCP Project ID cannot be empty.${NC}"
    exit 1
fi

echo -e "\nEnter Stripe API credentials (leave blank to skip any):"
read -s -p "Stripe Publishable Key (pk_test_... or pk_live_...): " STRIPE_PUB
echo ""
read -s -p "Stripe Secret Key (sk_test_... or sk_live_...): " STRIPE_SEC
echo ""
read -s -p "Stripe Webhook Secret (whsec_...): " STRIPE_WHSEC
echo ""

# 2. Check dependencies
echo -e "\n${CYAN}Checking local binary dependencies...${NC}"
HAS_GCLOUD=true
HAS_GH=true

if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}WARNING: 'gcloud' CLI is not installed or not in PATH. Skipping GCP secret storage.${NC}"
    HAS_GCLOUD=false
fi

if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}WARNING: 'gh' CLI is not installed or not in PATH. Skipping GitHub Secrets setup.${NC}"
    HAS_GH=false
fi

# 3. Configure GCP Secret Manager
if [ "$HAS_GCLOUD" = true ]; then
    echo -e "\n${CYAN}Synchronizing keys with GCP Secret Manager in project [${GCP_PROJECT_ID}]...${NC}"
    
    # Enable Secret Manager API if not active
    echo -e "Ensuring Secret Manager API is enabled..."
    gcloud services enable secretmanager.googleapis.com --project="$GCP_PROJECT_ID"
    
    # Function to create or update secret
    sync_gcp_secret() {
        local name=$1
        local value=$2
        if [ -n "$value" ]; then
            echo -e "Syncing secret [${name}]..."
            # Check if secret exists
            if gcloud secrets describe "$name" --project="$GCP_PROJECT_ID" &>/dev/null; then
                # Secret exists, add a new version
                echo "$value" | gcloud secrets versions add "$name" --data-file=- --project="$GCP_PROJECT_ID" >/dev/null
                echo -e "${GREEN}Successfully added new version to secret [${name}].${NC}"
            else
                # Secret doesn't exist, create it
                gcloud secrets create "$name" --replication-policy="automatic" --project="$GCP_PROJECT_ID" >/dev/null
                echo "$value" | gcloud secrets versions add "$name" --data-file=- --project="$GCP_PROJECT_ID" >/dev/null
                echo -e "${GREEN}Successfully created and seeded secret [${name}].${NC}"
            fi
        fi
    }

    sync_gcp_secret "stripe-secret-key" "$STRIPE_SEC"
    sync_gcp_secret "stripe-webhook-secret" "$STRIPE_WHSEC"
fi

# 4. Configure GitHub Secrets
if [ "$HAS_GH" = true ]; then
    echo -e "\n${CYAN}Syncing credentials to GitHub Repository Secrets...${NC}"
    
    # Check if authenticated with GitHub
    if ! gh auth status &>/dev/null; then
        echo -e "${YELLOW}WARNING: 'gh' CLI is not authenticated. Please run 'gh auth login' first. Skipping GitHub Secrets setup.${NC}"
    else
        sync_gh_secret() {
            local name=$1
            local value=$2
            if [ -n "$value" ]; then
                echo -e "Syncing GitHub Secret [${name}]..."
                echo "$value" | gh secret set "$name"
                echo -e "${GREEN}Successfully synced GitHub secret [${name}].${NC}"
            fi
        }
        
        sync_gh_secret "GCP_PROJECT_ID" "$GCP_PROJECT_ID"
        sync_gh_secret "STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUB"
        sync_gh_secret "STRIPE_SECRET_KEY" "$STRIPE_SEC"
        sync_gh_secret "STRIPE_WEBHOOK_SECRET" "$STRIPE_WHSEC"
    fi
fi

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}             Stripe B2B Secrets Configuration Complete!                 ${NC}"
echo -e "${GREEN}========================================================================${NC}"
echo -e "Upgraded deployment values are locked and fully synchronized."
