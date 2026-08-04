import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { API_CONFIG } from "@/config/apiConfig";

interface PostData {
  id: string;
  title: string;
  sapo: string;
  image: string;
  date: string;
  category: string;
  author: string;
  views: string;
  content: React.ReactNode;
}

const ARTICLE_DATABASE: { [id: string]: PostData } = {
  "evo200-lfp": {
    id: "evo200-lfp",
    title: "VinFast Evo200 LFP thế hệ mới: Đột phá cự ly di chuyển lên đến 205 km",
    sapo: "Mẫu xe máy điện thế hệ mới sở hữu cự ly di chuyển ấn tượng lên đến 205 km sau mỗi lần sạc đầy, vận hành êm ái cùng các tính năng thông minh vượt trội, hứa hẹn sẽ dẫn đầu xu hướng di chuyển xanh tại các đô thị lớn.",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80",
    date: "18/06/2026",
    category: "Sản phẩm",
    author: "Nguyễn Hoàng Nam",
    views: "1.240 lượt xem",
    content: (
      <>
        <p>
          Trong bối cảnh giá nhiên liệu biến động và xu hướng bảo vệ môi trường lên ngôi, xe máy điện đang trở thành phương tiện di chuyển lý tưởng tại các đô thị lớn. Mới đây, VinFast đã chính thức bàn giao dòng xe máy điện thế hệ mới mang tên <strong>VinFast Evo200</strong>, tích hợp công nghệ pin LFP tiên tiến mang đến những đột phá bất ngờ về quãng đường di chuyển và độ bền bỉ.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          1. Đột phá từ công nghệ pin LFP thế hệ mới
        </h2>
        <p>
          Điểm nhấn lớn nhất trên VinFast Evo200 chính là cụm pin LFP hợp tác sản xuất giữa VinFast và Gotion High-Tech. Khác với pin Lithium-ion thông thường, công nghệ pin LFP sở hữu dòng đời sạc xả lên tới hơn 2.000 lần sạc trước khi giảm hiệu năng xuống 70%, đồng thời giảm thiểu tối đa nguy cơ cháy nổ nhờ cấu trúc hóa học bền vững.
        </p>
        <blockquote className="border-l-4 border-[#E30613] bg-red-50/50 px-5 py-4 my-6 rounded-r-xl italic text-gray-800">
          “Công nghệ pin LFP là chìa khóa mở ra kỷ nguyên xe máy điện giá phổ thông nhưng cự ly di chuyển tiệm cận xe xăng. Với Evo200, nỗi lo sạc pin hàng ngày đã chính thức lùi vào quá khứ.”
        </blockquote>
        <p>
          Nhờ tối ưu hóa mật độ năng lượng và phần mềm quản lý pin BMS thông minh, VinFast Evo200 có thể di chuyển quãng đường tối đa lên đến <strong>205 km sau mỗi lần sạc đầy</strong> (theo điều kiện thử nghiệm tiêu chuẩn của hãng ở tốc độ 30 km/h). Đây là con số ấn tượng chưa từng có ở phân khúc xe máy điện phổ thông.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          2. Thiết kế châu Âu thanh lịch và thời thượng
        </h2>
        <p>
          Không chỉ sở hữu thông số vận hành ấn tượng, Evo200 còn ghi điểm mạnh mẽ nhờ diện mạo mang đậm hơi thở Ý. Kiểu dáng xe được bo tròn nhẹ nhàng từ yếm trước đến hông sau, tạo nên nét thanh lịch, nhỏ gọn rất phù hợp với việc di chuyển linh hoạt trong ngõ hẻm hay đường xá đông đúc tại Việt Nam.
        </p>
        <figure className="my-8 overflow-hidden rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src="https://images.unsplash.com/photo-1558981852-426c6c22a060?w=800&auto=format&fit=crop&q=80"
              alt="Thiết kế kiểu dáng thời thượng của VinFast Evo200"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <figcaption className="text-center text-xs text-gray-400 mt-2 font-medium">
            Mẫu xe ga điện thời trang, thanh lịch phù hợp với mọi độ tuổi học sinh, sinh viên và người đi làm
          </figcaption>
        </figure>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          3. Động cơ In-hub mạnh mẽ và tiết kiệm điện
        </h2>
        <p>
          Trái tim của VinFast Evo200 là khối động cơ In-hub đặt trực tiếp ở bánh sau, cho công suất định danh 1.500W và công suất tối đa lên đến 2.500W. Động cơ này giúp xe dễ dàng đạt tốc độ tối đa 70 km/h (đối với bản tiêu chuẩn) và leo dốc cầu, dốc hầm chung cư mượt mà không hề có độ trễ.
        </p>
        <p>
          Bên cạnh đó, tiêu chuẩn chống nước IP67 tiên tiến cho cả động cơ và hệ thống pin giúp Evo200 tự tin di chuyển qua những đoạn đường ngập nước sâu tới 0,5m trong vòng 30 phút mà không lo hỏng hóc chập điện.
        </p>

        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-6 mb-3">
          Thông số kỹ thuật chi tiết của VinFast Evo200:
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li><strong>Quãng đường:</strong> 205 km / 1 lần sạc đầy</li>
          <li><strong>Tốc độ tối đa:</strong> 70 km/h (Evo200) hoặc 49 km/h (Evo200 Lite)</li>
          <li><strong>Hệ thống phanh:</strong> Phanh đĩa trước, phanh tang trống sau</li>
          <li><strong>Tiêu chuẩn chống nước:</strong> IP67 cao cấp</li>
          <li><strong>Dung tích cốp xe:</strong> 22 lít rộng rãi chứa vừa 2 mũ bảo hiểm</li>
        </ul>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          4. Kết luận
        </h2>
        <p>
          Với mức giá vô cùng hợp lý cùng chính sách thuê pin linh hoạt độc quyền từ VinFast, Evo200 chính là sự thay thế hoàn hảo cho các dòng xe ga chạy xăng truyền thống. Xe không chỉ giúp tiết kiệm tối đa chi phí vận hành mà còn góp phần kiến tạo tương lai di chuyển xanh sạch và hiện đại hơn.
        </p>
      </>
    ),
  },
  "tram-sac-toan-quoc": {
    id: "tram-sac-toan-quoc",
    title: "Hạ tầng trạm sạc VinFast phủ sóng rộng khắp 63 tỉnh thành cả nước",
    sapo: "Bước đi chiến lược giúp đồng bộ hạ tầng sạc trên phạm vi toàn quốc, xóa bỏ nỗi lo cự ly di chuyển và mang lại sự tiện lợi tối đa cho hàng triệu chủ xe máy, ô tô điện.",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&auto=format&fit=crop&q=80",
    date: "12/06/2026",
    category: "Hạ tầng",
    author: "Trần Thu Thủy",
    views: "3.510 lượt xem",
    content: (
      <>
        <p>
          Hạ tầng trạm sạc chính là xương sống cho sự phát triển của hệ sinh thái xe điện. Nhận thức rõ điều này, VinFast đã đầu tư mạnh mẽ để xây dựng hệ thống hơn <strong>150.000 cổng sạc</strong> trên khắp 63 tỉnh thành tại Việt Nam.
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          1. Phủ sóng mọi nẻo đường đất nước
        </h2>
        <p>
          Hiện nay, trạm sạc VinFast được lắp đặt rộng khắp tại các địa điểm công cộng như bãi đỗ xe, trung tâm thương mại Vincom, chung cư Vinhomes, trạm dừng nghỉ trên đường cao tốc và các trạm xăng dầu liên kết.
        </p>
        <blockquote className="border-l-4 border-[#E30613] bg-red-50/50 px-5 py-4 my-6 rounded-r-xl italic text-gray-800">
          “Mục tiêu của VinFast là giúp người sử dụng xe điện có thể tìm thấy cổng sạc dễ dàng như tìm một trạm xăng truyền thống, mang lại sự yên tâm tuyệt đối trên mọi hành trình.”
        </blockquote>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          2. Công nghệ sạc nhanh thông minh an toàn
        </h2>
        <p>
          Hệ thống trạm sạc sử dụng công nghệ sạc tiêu chuẩn châu Âu, tích hợp các tính năng bảo vệ dòng điện, chống quá tải và chống cháy nổ tự động. Người dùng chỉ cần cắm sạc, quá trình thanh toán và theo dõi lượng điện sẽ được tự động đồng bộ qua ứng dụng điện thoại vô cùng tiện lợi.
        </p>
      </>
    ),
  },
  "uu-dai-feliz-s": {
    id: "uu-dai-feliz-s",
    title: "Chương trình đặt cọc sớm Feliz S nhận voucher phụ kiện trị giá 2 triệu đồng",
    sapo: "Chương trình đặt cọc sớm đầy hấp dẫn dành riêng cho mẫu xe máy điện quốc dân Feliz S, giúp khách hàng nhận ngay các ưu đãi đặc quyền và sở hữu xe nhanh nhất.",
    image: "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1200&auto=format&fit=crop&q=80",
    date: "10/06/2026",
    category: "Ưu đãi",
    author: "Phan Văn Minh",
    views: "2.150 lượt xem",
    content: (
      <>
        <p>
          Để tri ân khách hàng và thúc đẩy phong trào chuyển đổi phương tiện xanh, VinFast chính thức tung ra chương trình khuyến mãi đặt cọc sớm cực lớn dành cho khách hàng đăng ký đặt cọc mua mẫu xe máy điện quốc dân <strong>Feliz S</strong>.
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          1. Voucher quà tặng trị giá 2.000.000đ
        </h2>
        <p>
          Mọi đơn đặt cọc thành công trong thời gian diễn ra chương trình từ nay đến hết tháng sẽ được tặng ngay voucher mua sắm phụ kiện chính hãng tại showroom hoặc cấn trừ trực tiếp vào tiền cọc thuê pin của năm đầu tiên.
        </p>
        <blockquote className="border-l-4 border-[#E30613] bg-red-50/50 px-5 py-4 my-6 rounded-r-xl italic text-gray-800">
          “Feliz S là lựa chọn tuyệt vời cho gia đình nhờ thiết kế yên rộng, động cơ đầm chắc và cốp chứa đồ siêu rộng 25 lít. Chương trình đặt cọc sớm lần này chính là cơ hội vàng để sở hữu xe với mức giá tối ưu.”
        </blockquote>
      </>
    ),
  },
  "ben-bi-pin-lfp": {
    id: "ben-bi-pin-lfp",
    title: "Bí quyết kéo dài tuổi thọ pin LFP trên xe máy điện VinFast Evo200 và Feliz S",
    sapo: "Làm thế nào để duy trì hiệu năng sạc tối ưu và bảo vệ bộ pin LFP bền bỉ qua thời gian? Hãy cùng khám phá 5 mẹo nhỏ cực kỳ hữu ích được chia sẻ bởi các chuyên gia kỹ thuật.",
    image: "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=600&auto=format&fit=crop&q=80",
    date: "15/06/2026",
    category: "Mẹo sử dụng xe",
    author: "Nguyễn Văn Hùng",
    views: "1.820 lượt xem",
    content: (
      <>
        <p>
          Hệ thống pin LFP trang bị trên các mẫu xe máy điện đời mới của VinFast mang lại tuổi thọ rất cao, nhưng việc bảo dưỡng và sạc pin đúng cách vẫn đóng vai trò cực kỳ quan trọng giúp tăng thêm hiệu năng sử dụng lâu dài.
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          Các nguyên tắc sạc pin LFP hiệu quả:
        </h2>
        <p>
          - <strong>Không để pin cạn kiệt dưới 5%:</strong> Dù pin LFP bền bỉ, việc xả cạn năng lượng về 0% thường xuyên sẽ làm suy giảm cấu trúc tế bào pin. Bạn nên sạc xe khi dung lượng pin báo dưới 20%.
        </p>
        <p>
          - <strong>Sử dụng bộ sạc chính hãng:</strong> Bộ sạc đi kèm xe có chế độ ngắt điện tự động khi đầy và điều chỉnh dòng sạc an toàn, tránh gây hiện tượng quá nhiệt hay chai pin.
        </p>
      </>
    ),
  },
  "danh-gia-vento-s": {
    id: "danh-gia-vento-s",
    title: "Đánh giá chi tiết VinFast Vento S: Mẫu xe máy điện cận cao cấp đáng sở hữu nhất",
    sapo: "Với thiết kế thời thượng, động cơ mạnh mẽ công suất 5200W và tốc độ tối đa lên tới 80km/h, Vento S mang đến trải nghiệm lái thể thao đầy phấn khích cho người dùng.",
    image: "https://images.unsplash.com/photo-1558981806-69a72500f260?w=600&auto=format&fit=crop&q=80",
    date: "12/06/2026",
    category: "Đánh giá",
    author: "Lê Hoàng Hải",
    views: "980 lượt xem",
    content: (
      <>
        <p>
          Nằm trong phân khúc cận cao cấp của VinFast, <strong>Vento S</strong> thể hiện rõ đẳng cấp qua từng chi tiết thiết kế góc cạnh thể thao và khả năng vận hành đầy mạnh mẽ sánh ngang với các dòng xe tay ga xăng 150cc.
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          1. Động cơ Side-motor công suất vượt trội 5200W
        </h2>
        <p>
          Khác với dòng phổ thông đặt động cơ ở bánh xe, Vento S trang bị động cơ đặt giữa truyền động qua dây đai giúp xe phân bổ trọng lượng tối ưu, bứt tốc êm ái và đạt tốc độ tối đa lên đến 80 km/h vô cùng nhanh chóng.
        </p>
      </>
    ),
  },
  "nhan-xe-klara-s": {
    id: "nhan-xe-klara-s",
    title: "Khách hàng Việt hào hứng nhận xe Klara S: Biểu tượng sống xanh thanh lịch",
    sapo: "Ghi nhận không khí rộn ràng tại các showroom VinFast trên toàn quốc trong ngày đầu tiên bàn giao xe Klara S thế hệ mới sử dụng hệ thống pin LFP thuê tiện lợi.",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
    date: "08/06/2026",
    category: "Sự kiện",
    author: "Phùng Mỹ Linh",
    views: "1.450 lượt xem",
    content: (
      <>
        <p>
          Klara S từ lâu đã được xem là biểu tượng thời trang tinh tế của cộng đồng yêu thích phương tiện xanh. Thế hệ Klara S mới tích hợp pin LFP đem lại niềm hứng khởi lớn cho hàng ngàn khách hàng trong ngày bàn giao.
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          Không khí nhận xe hào hứng tại showroom
        </h2>
        <p>
          Rất nhiều khách hàng đã có mặt từ sáng sớm tại các đại lý lớn ở Hà Nội và TP.HCM để hoàn tất thủ tục bàn giao và nhận chiếc xe Klara S sang trọng của mình cùng gói khuyến mãi pin đi kèm đầy giá trị.
        </p>
      </>
    ),
  },
  "so-sanh-feliz-s-evo200": {
    id: "so-sanh-feliz-s-evo200",
    title: "So sánh xe Feliz S và Evo200: Đâu là lựa chọn hoàn hảo cho nhu cầu đi lại hàng ngày?",
    sapo: "Mỗi dòng xe đều có thế mạnh riêng biệt về kiểu dáng, chiều cao yên và dung tích cốp xe. Phân tích chi tiết giúp bạn chọn được chiếc xe phù hợp nhất với túi tiền.",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
    date: "05/06/2026",
    category: "Đánh giá",
    author: "Đặng Trung Kiên",
    views: "2.760 lượt xem",
    content: (
      <>
        <p>
          Quyết định lựa chọn giữa <strong>Feliz S</strong> rộng rãi và <strong>Evo200</strong> nhỏ gọn tinh tế luôn là nỗi băn khoăn của nhiều người mua xe máy điện lần đầu.
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          So sánh về mặt kích thước và cốp xe
        </h2>
        <p>
          Feliz S có yên cao và cốp 25L, phù hợp với những người có chiều cao tốt và nhu cầu đựng nhiều đồ. Trong khi đó, Evo200 thấp gọn hơn, cốp 22L, cực kỳ tối ưu cho học sinh sinh viên di chuyển nhẹ nhàng.
        </p>
      </>
    ),
  },
  "dang-ky-thue-pin": {
    id: "dang-ky-thue-pin",
    title: "Hướng dẫn đăng ký gói thuê pin xe máy điện VinFast trực tuyến siêu nhanh",
    sapo: "Quy trình 3 bước đăng ký thuê pin linh hoạt hoặc cố định thông qua website và ứng dụng VinFast, giúp tiết kiệm chi phí vận hành hàng tháng tối đa.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    date: "01/06/2026",
    category: "Mẹo sử dụng xe",
    author: "Hoàng Gia Bảo",
    views: "1.110 lượt xem",
    content: (
      <>
        <p>
          Gói thuê pin độc quyền từ VinFast giúp giải quyết triệt để vấn đề lo chai pin hay suy giảm dung lượng của chủ xe. Hãy cùng xem hướng dẫn đăng ký trực tuyến cực kỳ đơn giản sau đây.
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-[#E30613] pl-3">
          3 bước đăng ký nhanh chóng:
        </h2>
        <p>
          Bước 1: Truy cập ứng dụng hoặc liên kết tài khoản tại trang web. Bước 2: Chọn gói cước thuê pin linh hoạt hoặc cố định phù hợp với số km đi hàng tháng. Bước 3: Xác nhận bằng E-KYC và thanh toán trực tuyến.
        </p>
      </>
    ),
  }
};

type Props = {
  params: Promise<{ id: string }>;
};

async function fetchArticle(id: string): Promise<PostData | null> {
  try {
    const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/articles/${id}`, { cache: "no-store" });
    if (response.ok) {
      const item = await response.json();
      if (item) {
        const cleanContent = item.content.replace(/<[^>]*>/g, "");
        const sapo = cleanContent.length > 160 ? cleanContent.substring(0, 160) + "..." : cleanContent;
        
        let category = "Sự kiện";
        const titleLower = item.title.toLowerCase();
        if (titleLower.includes("đánh giá") || titleLower.includes("so sánh")) {
          category = "Đánh giá";
        } else if (titleLower.includes("pin") || titleLower.includes("sạc")) {
          category = "Mẹo sử dụng";
        }

        return {
          id: item.slug || item.id,
          title: item.title,
          sapo: sapo,
          image: item.imageThumbnail || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80",
          date: new Date(item.createdAt).toLocaleDateString("vi-VN"),
          category: category,
          author: "Ban Biên Tập VinFast",
          views: `${item.viewCount || 0} lượt xem`,
          content: <div dangerouslySetInnerHTML={{ __html: item.content }} />
        };
      }
    }
  } catch (err) {
    console.error("Lỗi khi kết nối API tải chi tiết bài viết, dùng dữ liệu tĩnh:", err);
  }
  return ARTICLE_DATABASE[id] || null;
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await fetchArticle(id);
  if (!post) {
    return {
      title: "Không tìm thấy bài viết | VinFast O2O",
    };
  }
  return {
    title: `${post.title}`,
    description: post.sapo,
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const post = await fetchArticle(id);

  if (!post) {
    notFound();
  }

  // Get related posts (excluding the current one)
  let relatedPosts: any[] = [];
  try {
    const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/articles?page=1&pageSize=6&status=Published`, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.items)) {
        relatedPosts = data.items
          .filter((item: any) => item.id !== post.id && item.slug !== post.id)
          .slice(0, 5)
          .map((item: any) => ({
            id: item.slug || item.id,
            title: item.title,
            image: item.imageThumbnail || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80",
            date: new Date(item.createdAt).toLocaleDateString("vi-VN")
          }));
      }
    }
  } catch (err) {
    // ignore, fallback below
  }

  if (relatedPosts.length === 0) {
    relatedPosts = Object.values(ARTICLE_DATABASE)
      .filter((p) => p.id !== post.id)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.title,
        image: p.image,
        date: p.date
      }));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6 flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 text-xs font-semibold text-gray-500">
          <li className="inline-flex items-center">
            <Link href="/" className="hover:text-[#E30613] transition-colors">
              Trang chủ
            </Link>
          </li>
          <li className="flex items-center gap-1.5 md:gap-2">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <Link href="/tin-tuc" className="hover:text-[#E30613] transition-colors">
              Tin tức
            </Link>
          </li>
          <li className="flex items-center gap-1.5 md:gap-2 text-gray-400 font-medium line-clamp-1 max-w-[150px] sm:max-w-xs md:max-w-md">
            <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span>{post.title}</span>
          </li>
        </ol>
      </nav>

      {/* Main Layout Grid (3:1 Column Division) */}
      <div className="grid gap-10 lg:grid-cols-12">
        {/* Left Column: Rich Text Content (75%) */}
        <article className="lg:col-span-8 flex flex-col" aria-labelledby="article-detail-title">
          {/* Category Badge */}
          <div>
            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#E30613] ring-1 ring-red-100 uppercase tracking-wider">
              {post.category}
            </span>
          </div>

          {/* Headline H1 */}
          <h1
            id="article-detail-title"
            className="mt-4 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl leading-tight"
          >
            {post.title}
          </h1>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-5 text-xs font-semibold text-gray-400 mt-5">
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span>Tác giả: {post.author}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span>{post.views}</span>
            </div>
          </div>

          {/* Lead Paragraph / Sapo */}
          <p className="mt-6 text-base sm:text-lg font-bold leading-relaxed text-gray-800 bg-gray-50/50 p-4 border-l-4 border-gray-300 rounded-r-xl">
            {post.sapo}
          </p>

          {/* Large Hero Image */}
          <div className="relative mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-gray-150 border border-gray-100 shadow-sm">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 1024px) 100vw, 75vw"
              className="object-cover"
              priority
              unoptimized
            />
          </div>

          {/* Rich Content Area */}
          <div className="mt-8 text-gray-700 text-base sm:text-lg leading-relaxed space-y-6">
            {post.content}
          </div>
        </article>

        {/* Right Column: Widgets / Sidebar (25%) */}
        <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24 h-fit">
          {/* Related Posts Widget */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
              Bài viết liên quan
            </h2>
            <div className="mt-4 divide-y divide-gray-100">
              {relatedPosts.map((rPost) => (
                <Link
                  key={rPost.id}
                  href={`/tin-tuc/${rPost.id}`}
                  className="group flex gap-3 py-3 first:pt-0 last:pb-0 items-start"
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-100">
                    <Image
                      src={rPost.image}
                      alt={rPost.title}
                      fill
                      sizes="64px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="line-clamp-2 text-xs font-bold leading-snug text-gray-800 transition-colors duration-300 group-hover:text-[#E30613]">
                      {rPost.title}
                    </h3>
                    <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                      {rPost.date}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* VinFast Deposit CTA Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E30613] to-red-800 p-6 text-white shadow-xl text-center group">
            {/* Soft decorative glow effects */}
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl transition-transform duration-700 group-hover:scale-150" />
            <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-white/10 blur-xl transition-transform duration-700 group-hover:scale-150" />

            <div className="relative z-10">
              <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-100 leading-none">
                Chương trình đặc biệt
              </span>
              <h2 className="mt-4 text-lg font-black leading-snug tracking-tight">
                Đặt cọc xe máy điện VinFast ngay hôm nay
              </h2>
              <p className="mt-2 text-xs text-red-100 leading-relaxed font-medium">
                Nhận ngay Voucher phụ kiện trị giá 3 triệu đồng &amp; ưu đãi bảo dưỡng 1 năm miễn phí.
              </p>
              <Link
                href="/dat-coc"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-xs font-black text-[#E30613] shadow-md transition-all duration-300 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                ĐẶT CỌC NGAY
                <svg className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
