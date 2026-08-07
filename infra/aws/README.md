# AWS deployment

The application runs as one portable Node.js container. It uses standard
PostgreSQL and the S3 API, so no source changes are required between local and
AWS environments.

## AWS resources

1. Amazon ECR repository for the Docker image.
2. AWS App Runner service or ECS Fargate service for the container.
3. Aurora Serverless v2 PostgreSQL or RDS PostgreSQL 16.
4. Private S3 bucket for uploaded media.
5. Secrets Manager secret containing `DATABASE_URL`.
6. App Runner/ECS IAM task role with `s3:GetObject` and `s3:PutObject` for
   `arn:aws:s3:::<bucket>/media/*`.
7. CloudFront and Route 53 for `InspireWithMusic.org` when the domain is ready.

## Runtime variables

```text
DATABASE_URL=postgresql://...
AWS_REGION=us-west-2
AWS_S3_BUCKET=inspire-with-music-media
NEXT_PUBLIC_APP_URL=https://InspireWithMusic.org
```

Use an IAM task role for S3. Do not put AWS access keys in the admin portal or
the repository. Database credentials remain in Secrets Manager; the Webmaster
screen exposes only connection health and safe public identifiers.

## Deploy outline

```bash
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-west-2.amazonaws.com
docker build -t inspire-with-music .
docker tag inspire-with-music:latest ACCOUNT.dkr.ecr.us-west-2.amazonaws.com/inspire-with-music:latest
docker push ACCOUNT.dkr.ecr.us-west-2.amazonaws.com/inspire-with-music:latest
```

Configure the App Runner/ECS health check as `/api/health`. Run the seed command
once with strong administrator passwords before opening the application to the
public.
