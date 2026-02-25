import { Link } from "react-router-dom";
import logoEtechs from "@/assets/logo-etechs-ETS.svg";
import { RegisterForm } from "../ui/RegisterForm/RegisterForm";

export function RegisterPage() {
    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
            <nav className="fixed w-full z-50 top-0 start-0 border-b border-border/50 bg-background/90 backdrop-blur-md">
                <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="flex items-center gap-2">
                            <div className="relative h-8 flex items-center justify-center">
                                <img src={logoEtechs} alt="ETECHS" className="h-8 w-auto" />
                            </div>
                            <span className="self-center text-xl font-bold whitespace-nowrap text-foreground">ETECHS</span>
                        </div>
                    </Link>
                    <div className="flex md:order-2 space-x-3 md:space-x-0">
                        <Link
                            className="text-primary-foreground bg-primary hover:bg-primary/90 font-medium rounded-lg text-sm px-4 py-2 text-center"
                            to="/login"
                        >
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="flex-grow flex items-center justify-center relative pt-20 pb-12 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-background via-primary/5 to-secondary/10"></div>
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
                    <div className="hidden md:block space-y-8 pr-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 text-primary border border-secondary/30 text-xs font-semibold uppercase tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                            Mạng xã hội học tập
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                            Học tập kết nối <br />
                            <span className="bg-gradient-to-r from-primary to-primary/70 text-transparent bg-clip-text dark:from-secondary dark:to-secondary/70">
                                cùng cộng đồng giảng dạy
                            </span>
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Kết nối người học và người dạy để chia sẻ tài liệu, khóa học, và kinh nghiệm thực tiễn. Tương tác trực tiếp qua bài viết,
                            thảo luận chuyên sâu và mạng lưới kết nối học tập.
                        </p>
                    </div>

                    <div className="w-full max-w-md mx-auto">
                        <div className="bg-card/95 backdrop-blur rounded-2xl shadow-2xl p-8 border border-border relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-foreground">Đăng ký tài khoản</h2>
                                <p className="text-sm text-muted-foreground mt-2">Bắt đầu hành trình chuyển đổi số của bạn</p>
                            </div>

                            <RegisterForm />
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                Đã có tài khoản?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                    Đăng nhập ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="bg-background border-t border-border/50 py-6">
                <div className="max-w-screen-xl mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        © 2026 ETECHS Platform. All Rights Reserved.{" "}
                        <a href="#" className="hover:text-primary ml-2 transition-colors">
                            Privacy Policy
                        </a>{" "}
                        •{" "}
                        <a href="#" className="hover:text-primary ml-2 transition-colors">
                            Terms
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
