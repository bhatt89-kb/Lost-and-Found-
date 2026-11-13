import React, { useEffect, useState, useCallback } from 'react';
import { fetchPosts, deletePost, fetchPendingCount, fetchMe } from '../services/api';
import PostCard from '../components/PostCard';
import PostDetail from '../components/PostDetail';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CreatePostModal from '../components/CreatePostModal';
import ClaimModal from '../components/ClaimModal';
import PendingClaimsModal from '../components/PendingClaimsModal';
import ReportModal from '../components/ReportModal';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, SearchIcon, PinIcon } from '../components/Icons';
import toast from 'react-hot-toast';

const PAGE_SIZE = 12;

const CATEGORIES = [
  { value: 'All', label: 'All items' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Keys', label: 'Keys' },
  { value: 'ID Cards', label: 'ID cards & documents' },
  { value: 'Clothing', label: 'Clothing & accessories' },
  { value: 'Other', label: 'Other' },
];

function SkeletonRows({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div className="skeleton-row" key={i}><i /><i /></div>
  ));
}

// A password-reset email links to  /?reset=<token>
const getResetTokenFromUrl = () => new URLSearchParams(window.location.search).get('reset') || '';

export default function Feed({ onOpenMine, onOpenAdmin }) {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Password reset: read the token from the link and open the login screen automatically
  const [resetToken, setResetToken] = useState(getResetTokenFromUrl);

  // Modal visibility
  const [isAuthOpen, setIsAuthOpen] = useState(() => !!getResetTokenFromUrl());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null); // claim modal
  const [managePost, setManagePost] = useState(null);     // review-claims modal
  const [detailPost, setDetailPost] = useState(null);     // detail drawer
  const [deleteTarget, setDeleteTarget] = useState(null); // delete confirmation
  const [reportTarget, setReportTarget] = useState(null); // report modal

  // Search & filter
  const [category, setCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Wait 400ms after typing stops, so we don't query on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Number of pending claims waiting on my posts (for the header badge)
  const refreshPending = useCallback(async () => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    try {
      const { data } = await fetchPendingCount();
      setPendingCount(data.count);
    } catch {
      // The badge is optional, so ignore errors quietly
    }
  }, [user]);

  // Load once when logged in, then check again every minute
  useEffect(() => {
    refreshPending();
    if (!user) return undefined;
    const t = setInterval(refreshPending, 60000);
    return () => clearInterval(t);
  }, [user, refreshPending]);

  // Find out if this account is an admin (the server enforces it; this only shows the button)
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    fetchMe()
      .then(({ data }) => setIsAdmin(data.role === 'admin'))
      .catch(() => setIsAdmin(false));
  }, [user]);

  // Load the first page (also used to refresh after create / claim / delete)
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchPosts({
        category,
        search: debouncedSearch,
        page: 1,
        limit: PAGE_SIZE,
      });
      setPosts(data.posts);
      setTotal(data.total);
      setPage(1);
    } catch (error) {
      console.error('Failed to load posts:', error);
      toast.error('Failed to load campus posts.');
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Load the next page and add it to the list
  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const { data } = await fetchPosts({
        category,
        search: debouncedSearch,
        page: next,
        limit: PAGE_SIZE,
      });
      // Skip anything already shown, in case new posts shifted the pages
      setPosts((prev) => [
        ...prev,
        ...data.posts.filter((p) => !prev.some((x) => x._id === p._id)),
      ]);
      setTotal(data.total);
      setPage(next);
    } catch (error) {
      console.error('Failed to load more posts:', error);
      toast.error('Could not load more posts.');
    } finally {
      setLoadingMore(false);
    }
  };

  // Action guards (require login before opening modals)
  const handleOpenCreate = () => (user ? setIsCreateOpen(true) : setIsAuthOpen(true));
  const handleOpenClaim = (post) => (user ? setSelectedPost(post) : setIsAuthOpen(true));
  const handleAskDelete = (post) => (user ? setDeleteTarget(post) : setIsAuthOpen(true));
  const handleOpenReport = (post) => (user ? setReportTarget(post) : setIsAuthOpen(true));

  const handleConfirmDelete = async () => {
    const post = deleteTarget;
    if (!post) return;
    try {
      await deletePost(post._id);
      toast.success('Post deleted successfully.');
      setDeleteTarget(null);
      if (detailPost?._id === post._id) setDetailPost(null);
      loadPosts();
      refreshPending();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error(error.response?.data?.error || 'Error deleting post.');
    }
  };

  // Called once the reset token has been used (or the screen was closed):
  // forget it and clean the address bar
  const handleResetDone = () => {
    setResetToken('');
    window.history.replaceState({}, '', window.location.pathname);
  };

  const filtersActive = category !== 'All' || searchTerm.trim() !== '';
  const clearFilters = () => { setCategory('All'); setSearchTerm(''); };

  return (
    <>
      {/* App header */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-mark"><PinIcon size={18} /></div>
            <div className="brand-name">
              <b>Campus Lost & Found</b>
              <span className="hide-sm">Find it. Prove it. Get it back.</span>
            </div>
          </div>

          <div className="header-right">
            {user ? (
              <>
                <span className="chip user">
                  <span className="beacon" />
                  {user.studentId}
                </span>
                {isAdmin && (
                  <button onClick={onOpenAdmin} className="btn btn-sm btn-secondary">
                    Admin
                  </button>
                )}
                <button onClick={onOpenMine} className="btn btn-sm btn-secondary">
                  My activity
                  {pendingCount > 0 && (
                    <span
                      title={`${pendingCount} pending ${pendingCount === 1 ? 'claim' : 'claims'} to review`}
                      style={{
                        marginLeft: 8,
                        background: '#e5484d',
                        color: '#fff',
                        borderRadius: 999,
                        padding: '1px 7px',
                        fontSize: 12,
                        fontWeight: 600,
                        lineHeight: '16px',
                      }}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { logout(); toast.success('Logged out successfully'); }}
                  className="btn btn-sm btn-secondary"
                >
                  Log out
                </button>
              </>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="btn btn-sm btn-primary">
                Log in / Register
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">Lost item registry</h1>
            <p className="page-lede">
              Items found around campus. Spot yours, answer the finder’s question, and arrange a safe handover.
            </p>
          </div>
          <div className="head-actions">
            <button onClick={handleOpenCreate} className="btn btn-primary">
              <PlusIcon size={16} />
              Report found item
            </button>
          </div>
        </div>

        {/* Search & filter */}
        <div className="search-row">
          <div className="input-wrap">
            <SearchIcon />
            <input
              type="text"
              className="input"
              placeholder="Search by building, floor, or keyword…"
              aria-label="Search items"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="pills" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={category === c.value}
              className={`pill ${category === c.value ? 'active' : ''}`}
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Item list */}
        <section className="list-card" aria-busy={loading}>
          <div className="list-label">
            <span>Recently found</span>
            {!loading && posts.length > 0 && <span>Showing {posts.length} of {total}</span>}
          </div>

          {loading ? (
            <div className="list shimmer"><SkeletonRows /></div>
          ) : posts.length === 0 ? (
            <div className="empty">
              <div className="empty-ghosts" aria-hidden="true"><SkeletonRows count={4} /></div>
              <div className="empty-copy">
                <h3>{filtersActive ? 'No matches found' : 'Nothing here yet!'}</h3>
                <p>
                  {filtersActive
                    ? 'Nothing matches your search. Try a different keyword or category.'
                    : 'When someone reports a found item, it’ll show up here so its owner can claim it.'}
                </p>
                {filtersActive ? (
                  <button className="btn btn-secondary" onClick={clearFilters}>Clear filters</button>
                ) : (
                  <button className="btn btn-secondary" onClick={handleOpenCreate}>Report found item</button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="list">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onOpen={setDetailPost}
                    onClaimClick={handleOpenClaim}
                    onManageClick={setManagePost}
                    onDeleteClick={handleAskDelete}
                  />
                ))}
              </div>

              {posts.length < total && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <div><b>Campus Lost & Found</b> · Privacy-first recovery platform</div>
          <div>Ownership verified by question, never by personal details</div>
        </div>
      </footer>

      {/* Overlays */}
      <PostDetail
        post={detailPost}
        onClose={() => setDetailPost(null)}
        onClaim={handleOpenClaim}
        onManage={setManagePost}
        onDelete={handleAskDelete}
        onReport={handleOpenReport}
      />
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete post?"
        body="You will be unable to recover this post once it is deleted."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        resetToken={resetToken}
        onResetDone={handleResetDone}
      />
      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onPostCreated={loadPosts} />
      <ClaimModal isOpen={!!selectedPost} post={selectedPost} onClose={() => setSelectedPost(null)} onClaimSubmitted={loadPosts} />
      <ReportModal isOpen={!!reportTarget} post={reportTarget} onClose={() => setReportTarget(null)} />
      <PendingClaimsModal
        isOpen={!!managePost}
        post={managePost}
        onClose={() => setManagePost(null)}
        onHandoverComplete={() => { setDetailPost(null); loadPosts(); refreshPending(); }}
      />
    </>
  );
}