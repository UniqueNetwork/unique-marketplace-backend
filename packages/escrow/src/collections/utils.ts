export const JOBS_TABLE_NAME = 'graphile_worker.jobs';

export const JOB_LOW_PRIORITY = 1000;
export const JOB_HIGH_PRIORITY = 0;

export function getJobName(collectionId, tokenId) {
  return `${collectionId}_${tokenId}`;
}
