import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // Makanan
  {
    id_produk: "P001",
    nama_produk: "Nasi Goreng Spesial + Telor",
    harga: 15000,
    kategori: "Makanan",
  },
  {
    id_produk: "P002",
    nama_produk: "Mie Ayam Bakso Pangsit",
    harga: 12000,
    kategori: "Makanan",
  },
  {
    id_produk: "P003",
    nama_produk: "Bakso Sapi Urat Premium",
    harga: 13000,
    kategori: "Makanan",
  },
  {
    id_produk: "P004",
    nama_produk: "Ayam Goreng Penyet Kremes",
    harga: 14000,
    kategori: "Makanan",
  },
  {
    id_produk: "P005",
    nama_produk: "Nasi Kuning Komplit",
    harga: 10000,
    kategori: "Makanan",
  },
  
  // Minuman
  {
    id_produk: "P006",
    nama_produk: "Es Teh Manis Jumbo",
    harga: 3000,
    kategori: "Minuman",
  },
  {
    id_produk: "P007",
    nama_produk: "Jus Alpukat Margarin Segar",
    harga: 7000,
    kategori: "Minuman",
  },
  {
    id_produk: "P008",
    nama_produk: "Susu Cokelat Dingin UHT",
    harga: 5000,
    kategori: "Minuman",
  },
  {
    id_produk: "P009",
    nama_produk: "Es Jeruk Kunci Peras",
    harga: 4000,
    kategori: "Minuman",
  },
  {
    id_produk: "P010",
    nama_produk: "Teh Tarik Aceh Ice",
    harga: 6000,
    kategori: "Minuman",
  },

  // Jajanan
  {
    id_produk: "P011",
    nama_produk: "Roti Bakar Cokelat Keju Sapi",
    harga: 8000,
    kategori: "Jajanan",
  },
  {
    id_produk: "P012",
    nama_produk: "Batagor Crispy Bandung",
    harga: 6000,
    kategori: "Jajanan",
  },
  {
    id_produk: "P013",
    nama_produk: "Pisang Goreng Madu Keju",
    harga: 5000,
    kategori: "Jajanan",
  },
  {
    id_produk: "P014",
    nama_produk: "Kentang Goreng Chili Powder",
    harga: 7000,
    kategori: "Jajanan",
  },
  {
    id_produk: "P015",
    nama_produk: "Cilok Bumbu Kacang Pedas",
    harga: 4000,
    kategori: "Jajanan",
  }
];

// Map Unsplash highly-appetizing food pictures for each product ID
export function getProductPlaceholderImage(id: string, kategori: string): string {
  const images: Record<string, string> = {
    P001: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80", // Fried rice
    P002: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80", // Noodles
    P003: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=600&q=80", // Meatballs
    P004: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=600&q=80", // Fried chicken
    P005: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80", // Yellow rice
    P006: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80", // Iced tea
    P007: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80", // Avocado juice
    P008: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80", // Chocolate milk
    P009: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80", // Orange juice
    P010: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80", // Milk tea
    P011: "https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=600&q=80", // Toast
    P012: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80", // Batagor / wonton fritter
    P013: "https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?auto=format&fit=crop&w=600&q=80", // Fried banana
    P014: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80", // French Fries
    P015: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=600&q=80", // Cilok / asian skewers
  };

  if (images[id]) return images[id];

  // Generics based on category
  if (kategori === "Makanan") {
    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";
  } else if (kategori === "Minuman") {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80";
  } else {
    return "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&w=600&q=80";
  }
}
