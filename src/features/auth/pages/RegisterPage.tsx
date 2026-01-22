import { Link } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a1f29] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#0a1f29]/90 backdrop-blur-md">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#1b7a78] opacity-20 rounded-full animate-pulse"></div>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1b7a78]">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>
              <span className="self-center text-xl font-bold whitespace-nowrap dark:text-white">ETECHS</span>
            </div>
          </Link>
          <div className="flex md:order-2 space-x-3 md:space-x-0">
            <Link
              className="text-white bg-[#1b7a78] hover:bg-teal-700 focus:ring-4 focus:outline-none focus:ring-teal-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-[#1b7a78] dark:hover:bg-teal-600 dark:focus:ring-teal-800"
              to="/login"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-grow flex items-center justify-center relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-50 via-teal-50/20 to-lime-50/30 dark:from-[#0a1f29] dark:via-[#132d3b] dark:to-teal-900/20"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1b7a78]/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4e937]/20 dark:bg-[#d4e937]/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div className="hidden md:block space-y-8 pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4e937]/20 text-teal-800 dark:text-[#d4e937] border border-[#d4e937]/30 text-xs font-semibold uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#d4e937] animate-pulse"></span>
              Trí tuệ nhân tạo thế hệ mới
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
              Từ Dữ Liệu Đến Trí Tuệ <br />
              <span className="bg-gradient-to-r from-[#1b7a78] to-[#26a69a] text-transparent bg-clip-text dark:bg-gradient-to-r dark:from-[#d4e937] dark:to-[#80cbc4]">
                Kiến Tạo Tương Lai Số
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Tham gia cùng hàng ngàn doanh nghiệp và tổ chức giáo dục đang chuyển đổi số toàn diện. Xây dựng hệ sinh thái thông minh, tự động hóa quy trình và kết nối không giới hạn.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1b7a78]/10 flex items-center justify-center text-[#1b7a78] dark:text-[#d4e937]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Phân tích sâu</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dự báo chính xác dựa trên dữ liệu lớn và AI.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1b7a78]/10 flex items-center justify-center text-[#1b7a78] dark:text-[#d4e937]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">Kết nối đa điểm</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Mạng lưới chia sẻ tri thức không giới hạn.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/90 dark:bg-[#132d3b]/85 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/20 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1b7a78] via-[#d4e937] to-[#1b7a78]"></div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Đăng ký tài khoản</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Bắt đầu hành trình chuyển đổi số của bạn</p>
              </div>

              <RegisterForm />

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-[#132d3b] text-slate-500">Hoặc đăng ký với</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button type="button" variant="outline" className="flex items-center justify-center w-full text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-[#132d3b] dark:text-slate-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  Google
                </Button>
                <Button type="button" variant="outline" className="flex items-center justify-center w-full text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 dark:bg-[#132d3b] dark:text-slate-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-5 h-5 mr-2 text-[#0078d4]" fill="currentColor" viewBox="0 0 23 23">
                    <path d="M0 0h11.377v11.372H0zM11.739 0h11.377v11.372H11.739zM0 11.739h11.377V23.11H0zM11.739 11.739h11.377V23.11H11.739z"></path>
                  </svg>
                  Microsoft
                </Button>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-medium text-[#1b7a78] hover:text-teal-700 dark:hover:text-[#d4e937] transition-colors">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 dark:bg-[#0a1f29] dark:border-gray-800 py-6">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            © 2024 ETECHS Platform. All Rights Reserved.{' '}
            <a href="#" className="hover:text-[#1b7a78] ml-2">
              Privacy Policy
            </a>{' '}
            •{' '}
            <a href="#" className="hover:text-[#1b7a78] ml-2">
              Terms
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
