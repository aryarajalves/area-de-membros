import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SupportImageLightboxModal from './SupportImageLightboxModal';

describe('SupportImageLightboxModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SupportImageLightboxModal
        isOpen={false}
        onClose={vi.fn()}
        imageUrl="https://example.com/test.png"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders image, title and close button when open', () => {
    const handleClose = vi.fn();
    render(
      <SupportImageLightboxModal
        isOpen={true}
        onClose={handleClose}
        imageUrl="https://example.com/test.png"
        title="Print do erro de execução"
      />
    );

    expect(screen.getByTestId('support-image-lightbox-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('support-image-lightbox-content')).toBeInTheDocument();
    expect(screen.getByText('Print do erro de execução')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-image')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-lightbox-btn');
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
