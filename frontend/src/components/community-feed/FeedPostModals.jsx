import React from 'react';
import DeleteFeedItemModal from './DeleteFeedItemModal';
import FeedLightboxModal from './FeedLightboxModal';
import FeedLikesModal from './FeedLikesModal';
import FeedPostInsightsModal from './FeedPostInsightsModal';
import FeedReportModal from './FeedReportModal';

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
    </>
  );
}
