const test = require("node:test");
const assert = require("node:assert/strict");

const { deleteSubmissionRecord } = require("../controllers/submission.controller");

test("deleteSubmissionRecord removes the submission for the current user and clears cache when no submissions remain", async () => {
  const queries = [];
  const pool = {
    async query(text, params) {
      queries.push({ text, params });

      if (text.startsWith("DELETE FROM submissions")) {
        return { rowCount: 1, rows: [{ id: 7 }] };
      }

      if (text.startsWith("SELECT id FROM submissions")) {
        return { rowCount: 0, rows: [] };
      }

      throw new Error(`Unexpected query: ${text}`);
    },
  };

  const removedUsers = [];
  const result = await deleteSubmissionRecord({
    pool,
    userId: 42,
    submissionId: 7,
    removeCache: (userId) => removedUsers.push(userId),
  });

  assert.equal(result.success, true);
  assert.equal(result.deleted, true);
  assert.deepEqual(removedUsers, [42]);
  assert.equal(queries[0].params[0], 7);
  assert.equal(queries[0].params[1], 42);
});
