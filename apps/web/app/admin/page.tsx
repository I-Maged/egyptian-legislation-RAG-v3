import {
  getAdminDashboardStats,
  getCorpusAnalytics,
  getFeedbackStats,
} from "@egyptian-law/db";

function formatMs(value: number | null): string {
  if (value === null) return "-";

  return `${Math.round(value)} ms`;
}

function formatPercent(value: number | null): string {
  return value === null ? "-" : `${value}%`;
}

export default async function AdminPage() {
  const [analytics, stats, feedbackTotals] = await Promise.all([
    getCorpusAnalytics(),
    getAdminDashboardStats(),
    getFeedbackStats(),
  ]);

  const { ragPerformance, retrievalQuality, usage, feedback, suggestions } =
    stats;

  return (
    <main className="admin-main">
      <h1>Egyptian Law — Admin</h1>

      <p>Minimal HITL dashboard for corpus management.</p>

      <h2>Corpus</h2>

      <div className="stats-grid">
        <Stat label="Laws" value={analytics.lawCount} />

        <Stat label="Articles" value={analytics.chunkCount} />

        <Stat label="Embeddings" value={analytics.embeddingCount} />

        <Stat label="Unembedded" value={analytics.unembeddedChunks} />
      </div>

      <h2>RAG Performance</h2>

      <div className="stats-grid">
        <Stat label="RAG runs" value={ragPerformance.totalRuns} />

        <Stat
          label="Avg retrieval time"
          value={formatMs(ragPerformance.avgRetrievalTimeMs)}
        />

        <Stat
          label="Avg generation time"
          value={formatMs(ragPerformance.avgGenerationTimeMs)}
        />

        <Stat
          label="Avg total time"
          value={formatMs(ragPerformance.avgTotalTimeMs)}
        />
      </div>

      {ragPerformance.models.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th align="left">Model</th>
              <th align="right">Runs</th>
              <th align="right">Avg total time</th>
            </tr>
          </thead>

          <tbody>
            {ragPerformance.models.map((model) => (
              <tr key={model.model}>
                <td>{model.model}</td>
                <td align="right">{model.runs}</td>
                <td align="right">{formatMs(model.avgTotalTimeMs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Retrieval Quality</h2>

      <div className="stats-grid">
        <Stat label="Citations" value={retrievalQuality.totalCitations} />

        <Stat
          label="Avg citations / answer"
          value={retrievalQuality.avgCitationsPerAnswer ?? "-"}
        />

        <Stat label="Avg rank" value={retrievalQuality.avgRank ?? "-"} />

        <Stat
          label="Avg score"
          value={
            retrievalQuality.avgScore === null
              ? "-"
              : Math.round(retrievalQuality.avgScore * 1000) / 1000
          }
        />

        <Stat
          label="Never-cited articles"
          value={retrievalQuality.neverCitedChunks}
        />
      </div>

      {retrievalQuality.topLaws.length > 0 && (
        <>
          <h3>Top cited laws</h3>

          <table className="data-table">
            <thead>
              <tr>
                <th align="left">Law</th>
                <th align="left">Number</th>
                <th align="left">Year</th>
                <th align="right">Citations</th>
              </tr>
            </thead>

            <tbody>
              {retrievalQuality.topLaws.map((law) => (
                <tr key={`${law.lawName}-${law.lawNumber ?? ""}-${law.year ?? ""}`}>
                  <td>{law.lawName}</td>
                  <td>{law.lawNumber ?? "-"}</td>
                  <td>{law.year ?? "-"}</td>
                  <td align="right">{law.citations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Usage</h2>

      <div className="stats-grid">
        <Stat label="Users" value={usage.userCount} />

        <Stat label="Conversations" value={usage.conversationCount} />

        <Stat label="Messages" value={usage.messageCount} />

        <Stat label="Answers generated" value={usage.assistantMessageCount} />

        <Stat
          label="Avg messages / conversation"
          value={usage.avgMessagesPerConversation ?? "-"}
        />
      </div>

      <h2>Feedback</h2>

      <div className="stats-grid">
        <Stat label="Total feedback" value={feedbackTotals.total} />

        <Stat label="Positive" value={feedbackTotals.positive} />

        <Stat label="Negative" value={feedbackTotals.negative} />

        <Stat
          label="Coverage"
          value={formatPercent(feedback.coverageRatePercent)}
        />

        <Stat
          label="Positive rate"
          value={formatPercent(feedback.positiveRatePercent)}
        />

        <Stat
          label="Negative with comments"
          value={feedback.negativeWithComments}
        />
      </div>

      {feedback.recentNegativeComments.length > 0 && (
        <>
          <h3>Recent negative comments</h3>

          <table className="data-table">
            <thead>
              <tr>
                <th align="left">User</th>
                <th align="left">Answer excerpt</th>
                <th align="left">Comment</th>
                <th align="left">Date</th>
              </tr>
            </thead>

            <tbody>
              {feedback.recentNegativeComments.map((item) => (
                <tr key={item.id}>
                  <td>{item.userName ?? item.userEmail}</td>
                  <td>{item.messageExcerpt}</td>
                  <td>{item.comment}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Suggestions</h2>

      <div className="stats-grid">
        <Stat label="Pending suggestions" value={suggestions.pendingCount} />
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>

      <div className="stat-value">{value}</div>
    </div>
  );
}
