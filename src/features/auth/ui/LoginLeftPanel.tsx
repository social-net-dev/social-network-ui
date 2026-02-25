import { BookOpen, MessageCircle, Users } from "lucide-react";
import logoEtechs from "@/assets/logo-etechs-ETS.svg";

export function LoginLeftPanel() {
    return (
        <>
            <div className="absolute inset-0 z-0">
                <img
                    alt="Mạng lưới kết nối học tập"
                    className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR5EyjEhRKKPI1-ar9uw9S8wajleMGc1WrMZRCfGpQfHN2vqFxl0C-vQgl0LG6nYdyII9xO2k0L9FQPNuwPWadpd4TOIWQjS18g-fFVMRPS1eozyyClVOhupcWRxD46arpFmwBESVA_ogEIH_e38vXSH3WEq15XOFz3uvRQwaZ-5ytWWI4E_Yy0bUVogdRyBjDln-N_Q6qvz1_q3cksu2OFH5jDyxrkzoxnO61drhs9Lu_zN3TNTcyrj7fp1-TlJWHchpsXZqR_c3f"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#02182B]/90 to-[#0E4E5A]/80 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02182B] via-transparent to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white h-full">
                <div className="flex justify-center">
                    <div className="flex items-center gap-3 mb-8">
                        <img src={logoEtechs} alt="ETECHS" className="h-9 w-auto" />
                        <span className="text-2xl font-bold tracking-tight">ETECHS</span>
                    </div>
                </div>
                <div className="mb-12 max-w-lg mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                        <span className="text-etechs-primary">Kết nối</span> người học <br />
                        <span className="text-etechs-primary">và</span> người dạy <br />
                        <span className="text-etechs-primary">trên một nền tảng</span>
                    </h1>
                    <p className="text-lg text-white/70 leading-relaxed mb-8">
                        Mạng xã hội học tập giúp chia sẻ tài liệu, trao đổi khóa học, thảo luận chuyên môn và xây dựng cộng đồng kết nối bền vững giữa
                        giảng viên và người học.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
                            <BookOpen className="w-5 h-5 text-etechs-primary" />
                            Tài liệu & khóa học
                        </div>
                        <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
                            <Users className="w-5 h-5 text-etechs-primary" />
                            Kết nối học tập
                        </div>
                        <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
                            <MessageCircle className="w-5 h-5 text-etechs-primary" />
                            Tương tác chuyên sâu
                        </div>
                    </div>
                </div>
                <div className="text-sm text-gray-400 text-center"> 2026 ETECHS. All Rights Reserved.</div>
            </div>
        </>
    );
}
