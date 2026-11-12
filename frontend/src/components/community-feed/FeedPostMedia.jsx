import React from 'react';
import FeedVideoPlayer from './FeedVideoPlayer';
import FeedMediaCarousel from './FeedMediaCarousel';

export default function FeedPostMedia({ post, onOpenLightbox }) {
  if (!post.media_urls || post.media_urls.length === 0) {
    return null;
  }

  const isVideo = post.media_type === 'video' || post.media_urls[0]?.match(/\.(mp4|webm|mov|m4v)$/i);
  const isCarousel = post.media_type === 'carousel' || post.media_urls.length > 1;

  return (
    <div className="feed-post-media-container" data-testid={`feed-post-media-${post.id}`}>
      {isVideo ? (
        <FeedVideoPlayer
          videoUrl={post.media_urls[0]}
          thumbnailUrl={post.media_thumbnail_url}
          onOpenLightbox={() => onOpenLightbox(0)}
        />
      ) : isCarousel ? (
        <FeedMediaCarousel
          mediaUrls={post.media_urls}
          onOpenLightbox={(idx) => onOpenLightbox(idx)}
        />
      ) : (
        <div
          className="feed-post-image-wrapper clickable"
          onClick={() => onOpenLightbox(0)}
          title="Clique para ampliar"
        >
          <img
            src={post.media_urls[0]}
            alt={`Mídia do post ${post.id}`}
            className="feed-post-image"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
