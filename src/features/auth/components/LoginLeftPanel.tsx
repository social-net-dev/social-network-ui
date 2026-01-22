import { Brain, Network, Shield } from 'lucide-react'

export function LoginLeftPanel() {
  return (
    <>
      <div className="absolute inset-0 z-0">
        <img
          alt="Mạng lưới dữ liệu AI trừu tượng"
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDR5EyjEhRKKPI1-ar9uw9S8wajleMGc1WrMZRCfGpQfHN2vqFxl0C-vQgl0LG6nYdyII9xO2k0L9FQPNuwPWadpd4TOIWQjS18g-fFVMRPS1eozyyClVOhupcWRxD46arpFmwBESVA_ogEIH_e38vXSH3WEq15XOFz3uvRQwaZ-5ytWWI4E_Yy0bUVogdRyBjDln-N_Q6qvz1_q3cksu2OFH5jDyxrkzoxnO61drhs9Lu_zN3TNTcyrj7fp1-TlJWHchpsXZqR_c3f"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#02182B]/90 to-[#0E4E5A]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#02182B] via-transparent to-transparent" />
      </div>
      <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white h-full">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-full bg-[#E2F046] flex items-center justify-center text-[#0E4E5A] font-bold text-xl">
              E
            </div>
            <span className="text-2xl font-bold tracking-tight">ETECHS</span>
          </div>
        </div>
        <div className="mb-12 max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Từ Dữ Liệu Đến Trí Tuệ – <br />
            <span className="text-[#E2F046]">Từ Kết Nối Đến Cách Mạng Số</span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            Tiên phong trong chuyển đổi số và trí tuệ nhân tạo, hợp nhất dữ liệu – quy trình – con người để kiến
            tạo hệ sinh thái số thông minh.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
              <Brain className="w-5 h-5 text-[#E2F046]" />
              AI Intelligence
            </div>
            <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
              <Network className="w-5 h-5 text-[#E2F046]" />
              Data Network
            </div>
            <div className="px-4 py-2 rounded-full glass-effect flex items-center gap-2 text-sm font-medium">
              <Shield className="w-5 h-5 text-[#E2F046]" />
              Secure Access
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-400">© 2024 ETECHS. All Rights Reserved.</div>
      </div>
    </>
  )
}
