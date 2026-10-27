#!/usr/bin/env bash
#
# Rolls the SSR service back to an earlier task definition revision, retags the
# :stable image to that revision's image, and waits for the service to settle.
#
# Usage:
#   ./scripts/rollback.sh        # the revision before the one running now
#   ./scripts/rollback.sh 3      # a specific revision
#
# The retag matters because SsrSiteStack's own task definition pulls :stable.
# Without it, a later `cdk deploy` would bring the rolled-back image back.

set -euo pipefail

CLUSTER="${ECS_CLUSTER:-astro-ssr}"
SERVICE="${ECS_SERVICE:-astro-ssr}"
FAMILY="${ECS_TASK_FAMILY:-astro-ssr}"

current_arn=$(aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$SERVICE" \
  --query 'services[0].taskDefinition' \
  --output text)
current_revision="${current_arn##*:}"
target_revision="${1:-$((current_revision - 1))}"

if [ "$target_revision" -lt 1 ]; then
  echo "No revision earlier than $current_revision to roll back to." >&2
  exit 1
fi

image=$(aws ecs describe-task-definition \
  --task-definition "$FAMILY:$target_revision" \
  --query 'taskDefinition.containerDefinitions[0].image' \
  --output text)
tag="${image##*:}"
repository="${image%:*}"
repository="${repository##*/}"

echo "Rolling $SERVICE back from revision $current_revision to $target_revision ($tag)"

if [ "$tag" = "stable" ]; then
  echo "Revision $target_revision already uses :stable; leaving the tag alone."
else
  manifest=$(aws ecr batch-get-image \
    --repository-name "$repository" \
    --image-ids imageTag="$tag" \
    --query 'images[0].imageManifest' \
    --output text)
  aws ecr put-image \
    --repository-name "$repository" \
    --image-tag stable \
    --image-manifest "$manifest" > /dev/null
  echo "Moved $repository:stable to $tag so a CDK deploy keeps this image."
fi

aws ecs update-service \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --task-definition "$FAMILY:$target_revision" \
  --output json > /dev/null
aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"

running=$(aws ecs describe-services \
  --cluster "$CLUSTER" \
  --services "$SERVICE" \
  --query 'services[0].taskDefinition' \
  --output text)
echo "Service is running $running"
