import { Modal as BootstrapModal, type ModalProps as BootstrapModalProps } from 'react-bootstrap';

type ModalProps = BootstrapModalProps & {
  title: string;
};

/**
 * Common Modal Component
 * @param {ModalProps} props - The props for the component.
 * @returns {JSX.Element}
 */
export const Modal = ({
  title,
  children,
  ...props
}: ModalProps) => {
  return (
    <BootstrapModal {...props}>
      <BootstrapModal.Header closeButton>
        <BootstrapModal.Title>{title}</BootstrapModal.Title>
      </BootstrapModal.Header>
      <BootstrapModal.Body>{children}</BootstrapModal.Body>
    </BootstrapModal>
  );
};

Modal.Footer = BootstrapModal.Footer;
