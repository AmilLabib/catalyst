type Props = {
  visible: boolean
  onClose: () => void
}

export default function InstructionsModal({ visible, onClose }: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold">Petunjuk</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <p className="mt-4 text-sm text-gray-700">masukkan data email dan password apapun tanpa harus email asli untuk mencoba masuk aplikasi</p>
        <div className="mt-6 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-full font-semibold">Tutup</button>
        </div>
      </div>
    </div>
  )
}
