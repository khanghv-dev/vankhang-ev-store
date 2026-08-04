import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { API_CONFIG } from "@/config/apiConfig";

export const metadata: Metadata = {
  title: "Tin tức & Sự kiện",
  description: "Cập nhật tin tức mới nhất về các dòng xe máy điện VinFast, hệ thống trạm sạc toàn quốc, các chương trình ưu đãi đặt cọc hấp dẫn và cẩm nang mẹo vặt sử dụng xe hiệu quả.",
};

interface Post {
  id: string;
  title: string;
  sapo: string;
  image: string;
  date: string;
  category: string;
  href: string;
}

const featuredPost: Post = {
  id: "featured",
  title: "VinFast chính thức giới thiệu dòng xe máy điện thông minh thế hệ mới Evo200 Lite với công nghệ pin LFP tiên tiến",
  sapo: "Mẫu xe máy điện thế hệ mới sở hữu cự ly di chuyển ấn tượng lên đến 205 km sau mỗi lần sạc đầy, vận hành êm ái cùng các tính năng thông minh vượt trội, hứa hẹn sẽ dẫn đầu xu hướng di chuyển xanh tại các đô thị lớn.",
  image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80",
  date: "18/06/2026",
  category: "Sự kiện",
  href: "/tin-tuc/evo200-lfp",
};

const posts: Post[] = [
  {
    id: "post-1",
    title: "Bí quyết kéo dài tuổi thọ pin LFP trên xe máy điện VinFast Evo200 và Feliz S",
    sapo: "Làm thế nào để duy trì hiệu năng sạc tối ưu và bảo vệ bộ pin LFP bền bỉ qua thời gian? Hãy cùng khám phá 5 mẹo nhỏ cực kỳ hữu ích được chia sẻ bởi các chuyên gia kỹ thuật.",
    image: "https://images.unsplash.com/photo-1558981852-426c6c22a060?w=600&auto=format&fit=crop&q=80",
    date: "15/06/2026",
    category: "Mẹo sử dụng xe",
    href: "/tin-tuc/ben-bi-pin-lfp",
  },
  {
    id: "post-2",
    title: "Đánh giá chi tiết VinFast Vento S: Mẫu xe máy điện cận cao cấp đáng sở hữu nhất",
    sapo: "Với thiết kế thời thượng, động cơ mạnh mẽ công suất 5200W và tốc độ tối đa lên tới 80km/h, Vento S mang đến trải nghiệm lái thể thao đầy phấn khích cho người dùng.",
    image: "https://images.unsplash.com/photo-1558981806-69a72500f260?w=600&auto=format&fit=crop&q=80",
    date: "12/06/2026",
    category: "Đánh giá",
    href: "/tin-tuc/danh-gia-vento-s",
  },
  {
    id: "post-3",
    title: "VinFast mở rộng mạng lưới 150.000 cổng sạc xe điện khắp các trạm dừng, chung cư",
    sapo: "Bước đi chiến lược giúp đồng bộ hạ tầng sạc trên phạm vi toàn quốc, xóa bỏ nỗi lo cự ly di chuyển và mang lại sự tiện lợi tối đa cho hàng triệu chủ xe máy, ô tô điện.",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=600&auto=format&fit=crop&q=80",
    date: "10/06/2026",
    category: "Sự kiện",
    href: "/tin-tuc/tram-sac-toan-quoc",
  },
  {
    id: "post-4",
    title: "Khách hàng Việt hào hứng nhận xe Klara S: Biểu tượng sống xanh thanh lịch",
    sapo: "Ghi nhận không khí rộn ràng tại các showroom VinFast trên toàn quốc trong ngày đầu tiên bàn giao xe Klara S thế hệ mới sử dụng hệ thống pin LFP thuê tiện lợi.",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
    date: "08/06/2026",
    category: "Sự kiện",
    href: "/tin-tuc/nhan-xe-klara-s",
  },
  {
    id: "post-5",
    title: "So sánh xe Feliz S và Evo200: Đâu là lựa chọn hoàn hảo cho nhu cầu đi lại hàng ngày?",
    sapo: "Mỗi dòng xe đều có thế mạnh riêng biệt về kiểu dáng, chiều cao yên và dung tích cốp xe. Phân tích chi tiết giúp bạn chọn được chiếc xe phù hợp nhất với túi tiền.",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80",
    date: "05/06/2026",
    category: "Đánh giá",
    href: "/tin-tuc/so-sanh-feliz-s-evo200",
  },
  {
    id: "post-6",
    title: "Hướng dẫn đăng ký gói thuê pin xe máy điện VinFast trực tuyến siêu nhanh",
    sapo: "Quy trình 3 bước đăng ký thuê pin linh hoạt hoặc cố định thông qua website và ứng dụng VinFast, giúp tiết kiệm chi phí vận hành hàng tháng tối đa.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    date: "01/06/2026",
    category: "Mẹo sử dụng xe",
    href: "/tin-tuc/dang-ky-thue-pin",
  },
];

export default async function NewsListingPage() {
  let fetchedPosts: Post[] = [];
  try {
    const response = await fetch(`${API_CONFIG.ORDER_URL}/api/admin/articles?page=1&pageSize=20&status=Published`, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        fetchedPosts = data.items.map((item: any) => {
          const cleanContent = item.content.replace(/<[^>]*>/g, "");
          const sapo = cleanContent.length > 160 ? cleanContent.substring(0, 160) + "..." : cleanContent;
          
          let category = "Sự kiện";
          const titleLower = item.title.toLowerCase();
          if (titleLower.includes("đánh giá") || titleLower.includes("so sánh")) {
            category = "Đánh giá";
          } else if (titleLower.includes("pin") || titleLower.includes("sạc")) {
            category = "Mẹo sử dụng xe";
          }

          return {
            id: item.slug || item.id,
            title: item.title,
            sapo: sapo,
            image: item.imageThumbnail || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80",
            date: new Date(item.createdAt).toLocaleDateString("vi-VN"),
            category: category,
            href: `/tin-tuc/${item.slug || item.id}`
          };
        });
      }
    }
  } catch (err) {
    console.error("Lỗi khi kết nối API Tin tức, sử dụng dữ liệu tĩnh dự phòng:", err);
  }

  if (fetchedPosts.length === 0) {
    // Fallback logic
    fetchedPosts = [
      {
        id: featuredPost.id,
        title: featuredPost.title,
        sapo: featuredPost.sapo,
        image: featuredPost.image,
        date: featuredPost.date,
        category: featuredPost.category,
        href: featuredPost.href
      },
      ...posts
    ];
  }

  const featured = fetchedPosts[0];
  const remainingPosts = fetchedPosts.slice(1);

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-12 border-b border-gray-100 pb-8 text-center sm:text-left">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Tin tức &amp; Sự kiện
        </h1>
        <p className="mt-3 text-base text-gray-500 max-w-2xl">
          Cập nhật những công bố mới nhất từ VinFast, đánh giá xe chuyên sâu, cẩm nang lái xe an toàn cùng các chương trình ưu đãi tốt nhất dành cho bạn.
        </p>
      </div>

      {/* Featured Section */}
      {featured && (
        <section className="mb-16" aria-label="Bài viết tiêu điểm">
          <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl lg:grid lg:grid-cols-12">
            {/* Featured Image */}
            <div className="relative h-64 overflow-hidden lg:col-span-7 lg:h-96">
              <Image
                src={featured.image}
                alt={featured.title}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-transform duration-500 group-hover:scale-102"
                priority
                unoptimized
              />
              <span className="absolute left-4 top-4 rounded-full bg-[#E30613] px-3.5 py-1 text-xs font-bold text-white shadow-md">
                {featured.category}
              </span>
            </div>

            {/* Featured Content */}
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5 lg:p-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  <span>{featured.date}</span>
                </div>
                <h2 className="mt-4 text-xl font-black leading-snug text-gray-900 sm:text-2xl group-hover:text-[#E30613] transition-colors duration-300">
                  <Link href={featured.href} id="featured-post-title">
                    {featured.title}
                  </Link>
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">
                  {featured.sapo}
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href={featured.href}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-[#E30613] hover:underline underline-offset-4 decoration-2"
                  id="featured-read-more"
                >
                  Đọc bài viết
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid Section */}
      <section className="mb-16" aria-label="Danh sách tin tức">
        <h2 className="mb-8 text-xl font-black text-gray-900 tracking-tight">
          Tất cả tin bài
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {remainingPosts.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
            >
              {/* Image Container */}
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  unoptimized
                />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-0.5 text-[10px] font-bold text-white tracking-wide uppercase leading-none backdrop-blur-sm">
                  {post.category}
                </span>
              </div>

              {/* Content Container */}
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="mt-3 line-clamp-3 text-sm font-bold leading-normal text-gray-900 transition-colors duration-300 group-hover:text-[#E30613]">
                    <Link href={post.href} id={`post-title-${post.id}`}>
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-500">
                    {post.sapo}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-50">
                  <Link
                    href={post.href}
                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 transition-colors group-hover:text-[#E30613] group-hover:underline underline-offset-4 decoration-2"
                    id={`post-btn-${post.id}`}
                  >
                    Xem chi tiết
                    <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Pagination */}
      <nav className="flex items-center justify-center border-t border-gray-100 pt-8" aria-label="Phân trang">
        <ul className="flex items-center gap-1.5">
          <li>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="Trang trước"
              id="btn-prev-page"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E30613] text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700"
              aria-current="page"
              id="btn-page-1"
            >
              1
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              id="btn-page-2"
            >
              2
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              id="btn-page-3"
            >
              3
            </button>
          </li>
          <li>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              id="btn-page-next"
              aria-label="Trang sau"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </li>
        </ul>
      </nav>
    </main>
  );
}
