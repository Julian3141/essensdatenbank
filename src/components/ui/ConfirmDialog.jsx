import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Abbrechen</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose() }}>Löschen</Button>
      </div>
    </Modal>
  )
}
