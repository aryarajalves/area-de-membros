import React from 'react';
import DeleteFeedItemModal from './DeleteFeedItemModal';
import FeedLightboxModal from './FeedLightboxModal';
import FeedLikesModal from './FeedLikesModal';
import FeedPostInsightsModal from './FeedPostInsightsModal';
import FeedReportModal from './FeedReportModal';
import BlockUserConfirmModal from './BlockUserConfirmModal';

export default function FeedPostModals({
  post,
  showDeleteModal,
  isDeleting,
  onConfirmDelete,
  onCloseDelete,
  lightboxOpen,
  lightboxIndex,
  onCloseLightbox,
  showLikesModal,
  onCloseLikes,
  showInsightsModal,
  onCloseInsights,
  showReportModal,
  onCloseReport,
  showBlockModal,
  onCloseBlock,
  onUserBlocked,
}) {
  return (
    <>
      <DeleteFeedItemModal
        isOpen={showDeleteModal}
        title="Excluir Publicação"
        message="Deseja realmente apagar esta publicação? Todos os comentários e curtidas serão excluídos permanentemente."
        isDeleting={isDeleting}
        onConfirm={onConfirmDelete}
        onClose={onCloseDelete}
      />

      <FeedLightboxModal
        isOpen={lightboxOpen}
        mediaUrls={post.media_urls || []}
        initialIndex={lightboxIndex}
        mediaType={post.media_type}
        thumbnailUrl={post.media_thumbnail_url}
        onClose={onCloseLightbox}
      />

      <FeedLikesModal
        isOpen={showLikesModal}
        postId={post.id}
        onClose={onCloseLikes}
      />

      <FeedPostInsightsModal
        isOpen={showInsightsModal}
        postId={post.id}
        onClose={onCloseInsights}
      />

      <FeedReportModal
        isOpen={showReportModal}
        postId={post.id}
        onClose={onCloseReport}
      />

      <BlockUserConfirmModal
        isOpen={showBlockModal}
        targetUser={post.author || (post.user_id ? { id: post.user_id, name: post.author_name } : null)}
        onClose={onCloseBlock}
        onBlocked={onUserBlocked}
      />
    </>
  );
}
