export interface Product {
  id_produk: string;
  nama_produk: string;
  harga: number;
  kategori: 'Makanan' | 'Minuman' | 'Jajanan';
  foto_drive_id?: string;
  stok?: number;
}

export interface CartItem {
  id_produk: string;
  nama_produk: string;
  harga: number;
  qty: number;
}

export interface TransactionPayload {
  action: 'simpanTransaksi';
  id_transaksi: string;
  total_harga: number;
  nominal_bayar: number;
  kembalian: number;
  metode: string;
  keranjang: CartItem[];
}
