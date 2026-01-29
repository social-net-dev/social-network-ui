import { Link } from "react-router-dom";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0a1f29] text-slate-800 dark:text-slate-100 transition-colors duration-300">
            <nav className="fixed w-full z-50 top-0 start-0 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#0a1f29]/90 backdrop-blur-md">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="flex items-center gap-2">
                            <div className="relative w-8 h-8 flex items-center justify-center">
                                <div className="absolute inset-0 bg-[#1b7a78] opacity-20 rounded-full animate-pulse"></div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-[#1b7a78]"
                                >
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
                            Tham gia cùng hàng ngàn doanh nghiệp và tổ chức giáo dục đang chuyển đổi số toàn diện. Xây dựng hệ sinh thái thông minh,
                            tự động hóa quy trình và kết nối không giới hạn.
                        </p>
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#1b7a78]/10 flex items-center justify-center text-[#1b7a78] dark:text-[#d4e937]">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
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
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
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
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Đã có tài khoản?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-[#1b7a78] hover:text-teal-700 dark:hover:text-[#d4e937] transition-colors"
                                >
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
                        © 2024 ETECHS Platform. All Rights Reserved.{" "}
                        <a href="#" className="hover:text-[#1b7a78] ml-2">
                            Privacy Policy
                        </a>{" "}
                        •{" "}
                        <a href="#" className="hover:text-[#1b7a78] ml-2">
                            Terms
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
