import { getCurrentYear } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const FooterLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="text-sm font-medium text-gray-500 transition hover:text-primary-600"
  >
    {label}
  </Link>
);

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-white border-t border-gray-100 py-20 lg:py-24">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-primary-50/50 blur-[100px]" />
      </div>

      <div className="px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-2 space-y-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-primary-500/10 group-hover:scale-105 transition-transform duration-300">
                <Image 
                  src="/logo-aegisflow.png" 
                  alt="AegisFlow AI Logo" 
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tight">
                AegisFlow AI
              </span>
            </Link>
            <p className="text-gray-500 text-base leading-relaxed max-w-sm">
              Nền tảng Digital Twin tiên phong tại Việt Nam, ứng dụng Trí tuệ Nhân tạo 
              để bảo vệ cộng đồng trước thiên tai và biến đổi khí hậu.
            </p>
            <div className="flex items-center gap-4">
               {/* Simplified Social Icons for Clean Look */}
               {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 hover:bg-primary-50 hover:border-primary-100 transition-colors cursor-pointer text-gray-400 hover:text-primary-600">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </div>
              ))}
            </div>
          </div>

          {/* Nav Columns */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Giải pháp</h4>
            <ul className="space-y-4 font-medium">
              <li><FooterLink href="/dashboard" label="Bản đồ trực tuyến" /></li>
              <li><FooterLink href="/#features" label="Dự báo lũ lụt" /></li>
              <li><FooterLink href="/#features" label="Phân tích rủi ro" /></li>
              <li><FooterLink href="/#features" label="Điều phối cứu hộ" /></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Công ty</h4>
            <ul className="space-y-4 font-medium">
              <li><FooterLink href="/about" label="Về chúng tôi" /></li>
              <li><FooterLink href="/blog" label="Tin tức & Sự kiện" /></li>
              <li><FooterLink href="/careers" label="Tuyển dụng" /></li>
              <li><FooterLink href="/contact" label="Liên hệ" /></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-6">Hỗ trợ</h4>
            <ul className="space-y-4 font-medium">
              <li><FooterLink href="/docs" label="Tài liệu HDSD" /></li>
              <li><FooterLink href="/api" label="Kết nối API" /></li>
              <li><FooterLink href="/privacy" label="Chính sách bảo mật" /></li>
              <li><FooterLink href="/terms" label="Điều khoản dịch vụ" /></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-400 text-sm font-medium">
            © {getCurrentYear()} AegisFlow AI. Bảo lưu mọi quyền.
          </p>
          <div className="flex items-center gap-8 text-sm font-bold text-gray-500">
            <Link href="/status" className="hover:text-primary-600 transition-colors">Tình trạng hệ thống</Link>
            <Link href="/support" className="hover:text-primary-600 transition-colors">Trung tâm hỗ trợ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
