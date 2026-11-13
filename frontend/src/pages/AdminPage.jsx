import React, { useEffect, useState, useCallback } from 'react';
import { fetchReports, dismissReport, adminDeletePost } from '../services/api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { ArrowLeftIcon, ClockIcon } from '../components/Icons';
import { timeAgo, splitLocation, toneFor } from '../utils/time';
import toast from 'react-hot-toast';

const REASON_LABELS = {
  spam: 'Spam',
  inappropriate: 'Inappropriate',
  misleading: 'Misleading',
  other: 'Other',
};

export default function AdminPage({ onBack }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null); // the report whose post may be removed

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchReports();
      setReports(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not load reports.');
      if (error.response?.status === 403) onBack();
    } finally {
      setLoading(false);
    }
  }, [onBack]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDismiss = async (report) => {
    try {
      await dismissReport(report._id);
      toast.success('Report dismissed.');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not dismiss report.');
    }
  };

  const handleRemove = async () => {
    const report = removeTarget;
    if (!report) return;
    try {
      await adminDeletePost(report.post_id._id);
      toast.success('Post removed.');
      setRemoveTarget(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not remove post.');
    }
  };

  return (
    <>
      <main className="page">
        <button type="button" className="back-btn" onClick={onBack} style={{ marginBottom: 16 }}>
          <ArrowLeftIcon size={16} /> Back to registry
        </button>

        <div className="page-head">
          <div>
            <h1 className="page-title">Reported posts</h1>
            <p className="page-lede">Review reports from students. Remove a post or dismiss the report.</p>
          </div>
        </div>

        <section className="list-card" aria-busy={loading}>
          <div className="list-label">
            <span>Open reports</span>
            {!loading && <span>{reports.length}</span>}
          </div>

          {loading ? (
            <div className="list shimmer">
              {[0, 1, 2].map((i) => <div className="skeleton-row" key={i}><i /><i /></div>)}
            </div>
          ) : reports.length === 0 ? (
            <div className="empty">
              <div className="empty-copy" style={{ margin: 0 }}>
                <h3>No open reports</h3>
                <p>Everything has been reviewed.</p>
              </div>
            </div>
          ) : (
            <div className="list">
              {reports.map((r) => {
                const post = r.post_id;
                const { building } = splitLocation(post.location_found);
                return (
                  <div className="row" key={r._id} style={{ cursor: 'default' }}>
                    {post.image_url && <img className="row-thumb" src={post.image_url} alt="" loading="lazy" />}
                    <div className="row-main">
                      <div className="row-title">
                        {post.category || 'Item'} found at <em>{building}</em>
                      </div>
                      {post.description && <div className="row-sub">“{post.description}”</div>}
                      <div className="row-tags">
                        <span className="tag red">{REASON_LABELS[r.reason] || r.reason}</span>
                        <span className={`tag ${toneFor(post.category)}`}>{post.category || 'Other'}</span>
                        <span className="row-sub">
                          Posted by {post.finder_id} · reported by {r.reporter_id}
                        </span>
                      </div>
                      {r.details && <div className="row-sub">Note: {r.details}</div>}
                    </div>
                    <div className="row-end">
                      <span className="chip hide-sm">
                        <ClockIcon size={15} />
                        {timeAgo(r.createdAt) || 'recently'}
                      </span>
                      <div className="row-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDismiss(r)}>
                          Dismiss
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setRemoveTarget(r)}>
                          Remove post
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <ConfirmDeleteModal
        isOpen={!!removeTarget}
        title="Remove this post?"
        body="The post, its photo and any claims are deleted for good, and the finder is told by email."
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
      />
    </>
  );
}