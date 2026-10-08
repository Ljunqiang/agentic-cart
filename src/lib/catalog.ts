export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  desc: string;
};

export const CATALOG: Product[] = [
  { id: 'perfume-rose', name: 'Rose Eau de Parfum 50ml', price: 48.0, category: 'beauty', emoji: '🌹', desc: 'Long-lasting floral fragrance with rose and peony notes' },
  { id: 'perfume-oud', name: 'Oud Noir Eau de Parfum 50ml', price: 62.0, category: 'beauty', emoji: '✨', desc: 'Dark woody scent with oud, amber and vanilla' },
  { id: 'choco-truffle', name: 'Belgian Truffle Box 12pc', price: 24.0, category: 'food', emoji: '🍫', desc: 'Handcrafted dark and milk chocolate truffles' },
  { id: 'choco-vegan', name: 'Vegan Sea Salt Caramel Bar', price: 8.5, category: 'food', emoji: '🍬', desc: 'Plant-based caramel chocolate with Himalayan salt' },
  { id: 'earbuds-pro', name: 'Noise-Cancelling Earbuds Pro', price: 89.0, category: 'tech', emoji: '🎧', desc: 'ANC earbuds with 30h battery and wireless charging case' },
  { id: 'watch-fit', name: 'FitTrack Smartwatch', price: 129.0, category: 'tech', emoji: '⌚', desc: 'AMOLED smartwatch with HR, SpO2 and sleep tracking' },
  { id: 'powerbank-20k', name: 'PowerBank 20000mAh 65W', price: 35.0, category: 'tech', emoji: '🔋', desc: 'Fast-charging power bank, charges laptops and phones' },
  { id: 'mug-warmer', name: 'Smart Mug Warmer', price: 29.0, category: 'home', emoji: '☕', desc: 'Keeps coffee at exact temperature, app-controlled' },
  { id: 'lamp-sunset', name: 'Sunset Projection Lamp', price: 19.0, category: 'home', emoji: '🌅', desc: 'Rotating sunset lamp with 16 colors for photos and mood' },
  { id: 'plant-monstera', name: 'Monstera Delight Plant Set', price: 42.0, category: 'home', emoji: '🪴', desc: 'Live monstera with ceramic pot and care kit' },
  { id: 'yoga-mat', name: 'Eco Yoga Mat 6mm', price: 32.0, category: 'sports', emoji: '🧘', desc: 'Non-slip natural rubber mat with alignment lines' },
  { id: 'bottle-steel', name: 'ThermoSteel Bottle 750ml', price: 27.0, category: 'sports', emoji: '🥤', desc: 'Keeps drinks cold 24h / hot 12h, leakproof' },
  { id: 'tee-organic', name: 'Organic Cotton Tee', price: 22.0, category: 'fashion', emoji: '👕', desc: 'Soft heavyweight tee, unisex, 5 colors' },
  { id: 'socks-pack', name: 'Comfy Socks 3-Pack', price: 15.0, category: 'fashion', emoji: '🧦', desc: 'Cushioned bamboo blend ankle socks' },
];

export function findProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}
