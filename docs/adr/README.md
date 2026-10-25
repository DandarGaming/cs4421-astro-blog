# Architecture Decision Records

Use the ADRs in this directory to record decisions that affect the structure,
runtime, deployment, content model, or long-term maintenance of the blog.

## How to use the templates

1. Copy the most relevant numbered template.
2. Replace the bracketed prompts with project-specific details.
3. Set the status to `Accepted`, `Rejected`, `Superseded`, or another agreed
   value.
4. Link related ADRs, pull requests, issues, and implementation files.
5. Keep the decision focused on one related group of choices.

The generic starting point is [ADR-000-template.md](./ADR-000-template.md).
The feature-specific templates are:

- [ADR-003: Content collections and content model](./ADR-003-content-collections-and-content-model.md)
- [ADR-004: Blog presentation and metadata](./ADR-004-blog-presentation-and-metadata.md)
- [ADR-005: Author pages and search](./ADR-005-author-pages-and-search.md)
- [ADR-006: Tags, categories, and topic archives](./ADR-006-tags-categories-and-topic-archives.md)
- [ADR-007: CI/CD and AWS deployment](./ADR-007-ci-cd-and-aws-deployment.md)
- [ADR-008: Static container image](./ADR-008-static-container-image.md)
- [ADR-009: Supabase playlist data](./ADR-009-supabase-playlist-data.md)

Existing decisions:

- [ADR-001: Transition to SSR and containers](./ADR-001-transition-to-ssr-and-containers.md)
- [ADR-002: Use static S3 and CloudFront hosting](./ADR-002-static-s3-cloudfront.md)
