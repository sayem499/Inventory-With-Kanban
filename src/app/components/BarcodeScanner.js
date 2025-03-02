import BarcodeReader from "react-barcode-reader";

export default function BarcodeScanner({ onScan }) {
  const handleScan = (barcode) => {
    if (barcode) {
      onScan(barcode);
    }
  };

  const handleError = (err) => {
    console.error("Barcode scan error:", err);
  };

  return (
    <div className="w-full p-4 bg-blue-50 text-center rounded-lg mb-4">
      <p className="text-gray-700 text-sm">Scan a barcode to fetch product details</p>
      <BarcodeReader onScan={handleScan} onError={handleError} />
    </div>
  );
}