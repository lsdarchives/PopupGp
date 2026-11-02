# Production backup infrastructure (draft)

This directory is an **incomplete, unapplied draft**, not an operational backup system. The Terraform currently describes a daily managed Firestore backup with 30-day retention, a private bucket in a separate project, and some service-account/bucket permissions. It does not yet configure or deploy the scheduled Firestore cross-project export, Firebase Auth metadata export, or Cloud Storage object-copy jobs. Do not run `terraform apply` and assume all three services are backed up.

The user selected Firestore, Auth, and Storage coverage, 30-day retention, and a recommended cloud destination. The intended destination is a dedicated Google Cloud/Firebase project and a private Cloud Storage bucket. This is separate from the local `.firebase-emulator-data` directory; Firebase Storage itself is a Cloud Storage service, not local disk storage.

## Prerequisites before activation

- An authorized owner must create/provide the dedicated backup project ID, link billing, and approve required APIs, IAM bindings, and costs.
- Confirm the source Storage bucket exists and provide its exact bucket name. The configured app bucket name is not proof that the bucket has been provisioned.
- Confirm the backup bucket location and access policy. Firestore managed backups stay in the source database's location; a separate managed export is needed for project-level isolation.
- Implement and validate scheduled export/copy jobs for Firestore, Auth metadata, and Storage objects, then test their restore steps in a non-production project.
- Review the Terraform plan and apply only after all of the above is ready. Production backup schedules/copies are not active until an authorized operator deploys and verifies them.

The planned Auth export deliberately excludes password hashes and hash parameters to avoid giving an automated job broad Auth write privileges or storing reusable password verifiers. A recovered account will require a password reset; federated accounts may need to sign in again.

## Recovery and limitations

Firestore managed backups restore to a new database and do not contain Security Rules or TTL policies. Keep rules, indexes, Functions source, and configuration separately backed up. Managed exports to a private bucket cost per document read and storage. Cloud Storage versioning/copies and lifecycle retention also incur storage/operation costs.

See [Firestore backups](https://cloud.google.com/firestore/docs/backups), [Firestore export/import](https://cloud.google.com/firestore/docs/manage-data/export-import), [Firebase Auth CLI export](https://firebase.google.com/docs/cli/auth), and [Cloud Storage Object Versioning](https://cloud.google.com/storage/docs/object-versioning) for product constraints and current pricing/permissions.
