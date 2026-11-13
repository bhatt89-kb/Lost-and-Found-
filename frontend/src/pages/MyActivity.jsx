import React, { useEffect, useState, useCallback } from 'react';
import { fetchMyPosts, fetchMyClaims, withdrawClaim, deletePost } from '../services/api';
import PostCard from '../components/PostCard';
import PostDetail from '../components/PostDetail';
import PendingClaimsModal from '../components/PendingClaimsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon, ClockIcon } from '../components/Icons';
import { timeAgo, splitLocation, toneFor } from '../utils/time';
import toast from 'react-hot-toast';

const CLAIM_STATUS = {
  pending: { label: 'Waiting for finder', tone: 'blue' },
  rejected: { label: 'Rejected', tone: 'red' },
  approved: { label: 'Approved', tone: 'green' },
};

export default function MyActivity({ onBack }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const [detailPost, setDetailPost] = useState(null);
  const [managePost, setManagePost] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([fetchMyPosts(), fetchMyClaims()]);
      setPosts(p.data);
      setClaims(c.data);
    } catch (error) {
      console.error(error);
      toast.error('Could not load your activity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) { onBack(); return; }
    load();
  }, [user, load, onBack]);

  const handleConfirmDelete = async () => {
    const post = deleteTarget;
    if (!post) return;
    try {
      await deletePost(post._id);
      toast.success('Post deleted successfully.');
      setDeleteTarget(null);
      if (detailPost?._id === post._id) setDetailPost(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error deleting post.');
    }
  };

  const handleWithdraw = async (claim) => {
    try {
      await withdrawClaim(claim._id);
      toast.success('Claim withdrawn.');
      load();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not withdraw claim.');
    }
  };

  const noop = () => {};

  return (
    <>
      <main className="page">
        <button type="button" className="back-btn" onClick={onBack} style={{ marginBottom: 16 }}>
          <ArrowLeftIcon size={16} /> Back to registry
        </button>

        <div className="page-head">
          <div>
            <h1 className="page-title">My activity</h1>
            <p className="page-lede">Items you reported and claims you made, in one place.</p>
          </div>
        </div>

        <div className="pills" role="tablist" aria-label="My activity">
          <button
            type="button" role="tab" aria-selected={tab === 'posts'}
            className={`pill ${tab === 'posts' ? 'active' : ''}`}
            onClick={() => setTab('posts')}
          >
            My posts ({posts.length})
          </button>
          <button
            type="button" role="tab" aria-selected={tab === 'claims'}
            className={`pill ${tab === 'claims' ? 'active' : ''}`}
            onClick={() => setTab('claims')}
          >
            My claims ({claims.length})
          </button>
        </div>

        <section className="list-card" aria-busy={loading}>
          {loading ? (
            <div className="list shimmer">
              {[0, 1, 2].map((i) => <div className="skeleton-row" key={i}><i /><i /></div>)}
            </div>
          ) : tab === 'posts' ? (
            posts.length === 0 ? (
              <div className="empty">
                <div className="empty-copy" style={{ margin: 0 }}>
                  <h3>You haven’t reported anything yet</h3>
                  <p>Items you report as found will show up here.</p>
                </div>
              </div>
            ) : (
              <div className="list">
                {posts.map((post) => (
                  <div key={post._id}>
                    <PostCard
                      post={post}
                      onOpen={setDetailPost}
                      onClaimClick={noop}
                      onManageClick={setManagePost}
                      onDeleteClick={setDeleteTarget}
                    />
                    {post.pendingClaims > 0 && (
                      <div className="row-sub" style={{ padding: '0 14px 10px 58px' }}>
                        {post.pendingClaims} pending {post.pendingClaims === 1 ? 'claim' : 'claims'} to review
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : claims.length === 0 ? (
            <div className="empty">
              <div className="empty-copy" style={{ margin: 0 }}>
                <h3>No claims yet</h3>
                <p>When you claim an item, you can follow its status here.</p>
              </div>
            </div>
          ) : (
            <div className="list">
              {claims.map((c) => {
                const post = c.post_id;
                const { building } = splitLocation(post.location_found);
                const status = CLAIM_STATUS[c.status] || CLAIM_STATUS.pending;
                return (
                  <div className="row" key={c._id} style={{ cursor: 'default' }}>
                    <span className={`row-box ${c.status === 'pending' ? 'pending' : ''}`} />
                    {post.image_url && <img className="row-thumb" src={post.image_url} alt="" loading="lazy" />}
                    <div className="row-main">
                      <div className="row-title">
                        {post.category || 'Item'} found at <em>{building}</em>
                      </div>
                      <div className="row-tags">
                        <span className={`tag ${toneFor(post.category)}`}>{post.category || 'Other'}</span>
                        <span className={`tag ${status.tone}`}>{status.label}</span>
                        <span className="row-sub">Your answer: “{c.verification_answer}”</span>
                      </div>
                    </div>
                    <div className="row-end">
                      <span className="chip hide-sm">
                        <ClockIcon size={15} />
                        {timeAgo(c.createdAt) || 'recently'}
                      </span>
                      {c.status === 'pending' && (
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleWithdraw(c)}>
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <PostDetail
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onClaim={noop}
        onManage={setManagePost}
        onDelete={setDeleteTarget}
      />
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete post?"
        body="You will be unable to recover this post once it is deleted."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      <PendingClaimsModal
        isOpen={!!managePost}
        post={managePost}
        onClose={() => setManagePost(null)}
        onHandoverComplete={() => { setDetailPost(null); setManagePost(null); load(); }}
      />
    </>
  );
}