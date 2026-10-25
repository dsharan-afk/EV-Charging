import React, { useState } from 'react';
import {
  ChevronDown,
  HelpCircle,
  Search,
  Zap,
  CreditCard,
  Shield,
  Layers,
  Car,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'charging' | 'pricing' | 'booking' | 'architecture';
  question: string;
  answer: string;
}

export const FaqView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'charging' | 'pricing' | 'booking' | 'architecture'>('all');
  const [openIds, setOpenIds] = useState<string[]>(['faq_1', 'faq_4']);

  const faqData: FaqItem[] = [
    {
      id: 'faq_1',
      category: 'charging',
      question: 'What charging speeds and connector standards does EV Charged support across India?',
      answer: 'EV Charged stations support both ultra-fast DC charging (up to 350 kW) and Level 2 AC charging across major Indian metros (Chennai, Bengaluru, Delhi NCR, Mumbai, Hyderabad, Pune, Kolkata, Ahmedabad) and key National Expressways (Mumbai-Pune Expressway, Bengaluru-Chennai NH48, Delhi-Jaipur Highway). Supported connectors include CCS2 (India standard for Tata Nexon.ev, Hyundai Ioniq, MG ZS, Mahindra XUV400), Type 2 Mennekes AC, and NACS/CHAdeMO adapters. Your registered EV will automatically filter for compatible ports.',
    },
    {
      id: 'faq_2',
      category: 'charging',
      question: 'Will 350kW DC ultra-fast charging degrade my EV battery pack?',
      answer: 'Modern electric vehicles utilize intelligent Battery Management Systems (BMS) that regulate input power along a tailored charging curve. Peak speeds occur between 10% and 50% State of Charge (SoC), tapering as the pack fills up. EV Charged recommends setting your target SoC to 80% for optimal battery health on daily routes.',
    },
    {
      id: 'faq_3',
      category: 'booking',
      question: 'How far in advance can I reserve a charging stall, and is there a grace period?',
      answer: 'Drivers can reserve dedicated charging stalls up to 48 hours in advance or instantaneously while en route. Once your slot commences, you have a 15-minute grace window to plug in and authenticate via QR Pass or RFID tap before the stall is re-opened to other drivers.',
    },
    {
      id: 'faq_4',
      category: 'pricing',
      question: 'How are session fees, energy billing, and idle fees calculated?',
      answer: 'Pricing is purely consumption-based at a fixed rate per kilowatt-hour (₹18.50 - ₹22.00/kWh depending on peak grid tariff and station location). There is zero reservation markup. To prevent congestion, an idle fee of ₹25/min applies if an EV remains plugged into a high-demand stall 10 minutes after reaching target charge.',
    },
    {
      id: 'faq_5',
      category: 'pricing',
      question: 'Can I pay automatically using the EV Charged Wallet or RFID ChargePass?',
      answer: 'Yes! You can link a physical or virtual NFC RFID ChargePass to your EV Charged account or pre-fund your EV Charged Prepaid Wallet with UPI, NetBanking, or Cards. Simply tap your phone or RFID tag at the stall kiosk to initiate charging; upon unplugging, payment is settled immediately with a downloadable electronic tax receipt.',
    },
    {
      id: 'faq_6',
      category: 'architecture',
      question: 'How does the 5-layer enterprise architecture ensure 99.8% network uptime?',
      answer: 'The system segregates concerns across 5 distinct tiers: Presentation (HTML/CSS/JS with reactive state), Application (Spring Boot 3 REST endpoints), Business/Domain (Java OOP conflict verification & charging telemetry services), Data Access (Spring Data JPA & Hibernate connection pooling), and Database (MySQL 8 InnoDB with ACID transaction isolation). If hardware telemetry experiences latency, the booking and billing engines remain isolated and fully functional.',
    },
    {
      id: 'faq_7',
      category: 'architecture',
      question: 'How do I download or print an official tax invoice for fleet expense reports?',
      answer: 'Every completed session generates an electronic tax invoice with timestamp, kWh consumed, tax breakdown, and vehicle VIN. Navigate to the Profile tab, scroll to Billing History, and click "Receipt". The site includes an automatic print stylesheet configured for clean 8.5x11 PDF exports.',
    },
  ];

  const toggleOpen = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredFaqs = faqData.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto">
          <HelpCircle className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Frequently Asked Questions
        </h1>
        <p className="text-xs text-neutral-400 max-w-lg mx-auto">
          Everything you need to know about ultra-fast charging, connector standards, reservations, billing, and system architecture.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search question or keyword..."
          className="w-full rounded-xl bg-neutral-900 border border-neutral-800 pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {[
          { id: 'all', label: 'All Questions' },
          { id: 'charging', label: 'Charging & Hardware' },
          { id: 'booking', label: 'Booking & Reservations' },
          { id: 'pricing', label: 'Pricing & Wallet' },
          { id: 'architecture', label: '5-Layer Architecture' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategory === cat.id
                ? 'bg-emerald-500 text-neutral-950 font-bold'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const isOpen = openIds.includes(faq.id);

          return (
            <div
              key={faq.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden transition-all hover:border-neutral-700"
            >
              <button
                onClick={() => toggleOpen(faq.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
              >
                <span className="font-semibold text-white text-sm">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-neutral-300 leading-relaxed border-t border-neutral-800/80 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
