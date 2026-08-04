"use client";

import React, { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ArticleData {
  title: string;
  categoryName: string;
  lastUpdated: string;
  intro: string;
  steps: string[];
  note: string;
}

const ARTICLE_DB: Record<string, ArticleData> = {
  "su-dung-xe": {
    title: "Hướng dẫn vận hành & sạc xe máy điện VinFast đúng cách",
    categoryName: "Sử dụng Xe",
    lastUpdated: "Cập nhật 2 ngày trước",
    intro: "Để xe máy điện VinFast thế hệ mới hoạt động bền bỉ, an toàn và tối ưu hóa tuổi thọ của pin LFP, Quý khách vui lòng tuân thủ các bước kết nối ứng dụng và sạc pin theo quy trình chuẩn dưới đây.",
    steps: [
      "Bật khóa xe máy điện và mở kết nối Bluetooth trên điện thoại thông minh của bạn.",
      "Tải ứng dụng VinFast từ App Store hoặc Google Play, đăng nhập và quét mã QR Code trên khung xe để thực hiện liên kết xe.",
      "Khi sạc xe tại nhà, hãy cắm phích sạc vào nguồn điện gia đình trước (ổ điện 220V ổn định), sau đó mới cắm giắc sạc vào cổng sạc trên xe.",
      "Trong quá trình sạc, đèn LED trên bộ sạc sẽ báo màu đỏ (đang sạc) và tự động chuyển sang màu xanh (đã đầy 100%) kèm chức năng ngắt điện thông minh để bảo vệ pin.",
      "Khi rút sạc, hãy rút đầu cắm trên xe trước rồi mới rút phích cắm khỏi nguồn điện gia đình để tránh tạo ra hiện tượng phóng điện hồ quang."
    ],
    note: "Vui lòng không để dung lượng pin cạn kiệt xuống dưới 5% thường xuyên. Nếu không sử dụng xe trong thời gian dài (trên 14 ngày), hãy sạc pin đạt từ 50% đến 70% trước khi tắt nguồn điện chính để giữ tuổi thọ pin ở mức tốt nhất."
  },
  "pin-tram-sac": {
    title: "Chính sách thuê pin & Quy định sử dụng Trạm sạc công cộng VinFast",
    categoryName: "Pin & Trạm Sạc",
    lastUpdated: "Cập nhật 3 ngày trước",
    intro: "Hệ thống trạm sạc và chính sách thuê pin độc quyền của VinFast giúp khách hàng an tâm tuyệt đối về chất lượng pin mà không chịu rủi ro hao mòn. Dưới đây là các chính sách chi tiết và hướng dẫn sử dụng trạm sạc công cộng.",
    steps: [
      "Đăng ký gói thuê pin phù hợp với nhu cầu sử dụng (Gói linh hoạt giới hạn số km hoặc gói cố định không giới hạn km di chuyển hàng tháng).",
      "Khi đến trạm sạc công cộng, đỗ xe vào đúng vị trí sạc quy định, tắt máy xe hoàn toàn trước khi thao tác.",
      "Sử dụng ứng dụng VinFast quét mã QR dán trực tiếp trên cây sạc để mở khóa cổng sạc tương ứng.",
      "Cắm giắc sạc chắc chắn vào xe. Trạng thái sạc và số điện năng tiêu thụ sẽ được cập nhật trực tiếp trên màn hình điện thoại.",
      "Khi sạc xong hoặc muốn dừng sạc giữa chừng, bấm 'Dừng sạc' trên ứng dụng trước khi rút giắc sạc và thanh toán tự động qua ví điện tử liên kết."
    ],
    note: "Mọi hành vi làm hư hỏng pin thuê, tự ý tháo dỡ cụm pin LFP hoặc sử dụng bộ sạc không chính hãng gây cháy nổ pin sẽ bị phạt hủy hợp đồng thuê pin và bồi thường thiệt hại theo giá trị gốc của bộ pin công bố tại thời điểm vi phạm."
  },
  "bao-hanh": {
    title: "Quy trình kích hoạt Bảo hành điện tử & Đăng ký dịch vụ sửa chữa",
    categoryName: "Bảo hành",
    lastUpdated: "Cập nhật 1 ngày trước",
    intro: "Mọi dòng xe máy điện VinFast chính hãng đều được áp dụng chế độ bảo hành điện tử hiện đại. Hướng dẫn chi tiết dưới đây giúp Quý khách kích hoạt nhanh chóng và đặt lịch bảo dưỡng lưu động khi có nhu cầu.",
    steps: [
      "Kiểm tra sổ bàn giao xe và lấy mã PIN kích hoạt bảo hành được showroom cung cấp.",
      "Mở ứng dụng VinFast, vào phần cá nhân chọn 'Kích hoạt Bảo hành điện tử' và nhập thông tin số khung (VIN), số máy của xe.",
      "Xác nhận thông tin cá nhân chính chủ khớp với hợp đồng mua bán xe để hoàn tất kích hoạt. Thời hạn bảo hành sẽ hiển thị trực quan ngay trên app.",
      "Để đăng ký lịch sửa chữa hoặc bảo dưỡng định kỳ, vào mục 'Dịch vụ' -> 'Đặt lịch hẹn', chọn Showroom gần nhất và mốc giờ mong muốn.",
      "Khi gặp sự cố hư hỏng dọc đường, chọn 'Yêu cầu cứu hộ khẩn cấp' để định vị vị trí xe và gọi Hotline cứu hộ lưu động 24/7."
    ],
    note: "Chế độ bảo hành có thể bị từ chối nếu xe đã qua sửa chữa, thay thế linh kiện không chính hãng tại các cơ sở ngoài hệ thống ủy quyền của VinFast, hoặc tự ý nâng cấp công suất động cơ sai lệch thông số kỹ thuật đăng kiểm của nhà sản xuất."
  },
  "tra-gop": {
    title: "Hướng dẫn thủ tục mua xe máy điện VinFast trả góp 0% lãi suất",
    categoryName: "Trả góp",
    lastUpdated: "Cập nhật 5 ngày trước",
    intro: "Sở hữu xe điện VinFast chưa bao giờ dễ dàng hơn thế với chương trình trả góp lãi suất 0% liên kết cùng nhiều ngân hàng lớn. Dưới đây là các phương thức thực hiện và hồ sơ cần chuẩn bị.",
    steps: [
      "Lựa chọn dòng xe mong muốn đặt mua trên hệ thống O2O và tiến hành chọn phương thức thanh toán là 'Trả góp 0%'.",
      "Chọn thanh toán bằng thẻ tín dụng (Visa/Mastercard) của một trong 20+ ngân hàng đối tác liên kết để duyệt hồ sơ online ngay lập tức.",
      "Đối với hình thức vay qua công ty tài chính, chuẩn bị đầy đủ Căn cước công dân gắn chip và ảnh chân dung chụp chính diện.",
      "Lựa chọn kỳ hạn trả góp phù hợp với khả năng tài chính của bạn (3 tháng, 6 tháng, 9 tháng hoặc 12 tháng).",
      "Sau khi hồ sơ được phê duyệt thành công, hệ thống sẽ gửi mã xác nhận nhận xe tại showroom được chỉ định trong vòng 24 - 48 giờ."
    ],
    note: "Với hình thức trả góp qua thẻ tín dụng, Quý khách cần đảm bảo hạn mức khả dụng của thẻ lớn hơn hoặc bằng toàn bộ giá trị đơn hàng xe máy điện tại thời điểm đăng ký thực hiện giao dịch."
  },
  "dieu-khoan-su-dung": {
    title: "Điều khoản & Điều kiện sử dụng Nền tảng O2O VinFast",
    categoryName: "Điều khoản pháp lý",
    lastUpdated: "Cập nhật hôm nay",
    intro: "Chào mừng Quý khách đến với Nền tảng thương mại điện tử O2O chính thức của VinFast. Việc truy cập, tham khảo thông tin hoặc đặt cọc giữ chỗ mua sản phẩm xe máy điện đồng nghĩa với việc Quý khách chấp thuận các điều khoản dưới đây.",
    steps: [
      "Quý khách cam kết cung cấp thông tin cá nhân (Họ tên, Số điện thoại, CCCD, Email) chính xác và trùng khớp với giấy tờ pháp lý khi nhận xe.",
      "Mọi thông tin về thông số kỹ thuật, màu sắc, giá bán công bố trên website có giá trị pháp lý tại thời điểm niêm yết.",
      "Người dùng có trách nhiệm tự bảo mật tài khoản đăng nhập và không chia sẻ OTP giao dịch cho bất kỳ bên thứ ba nào.",
      "Hệ thống VinFast O2O bảo lưu quyền từ chối hoặc hủy bỏ đơn đặt cọc nếu phát hiện có hành vi gian lận, đầu cơ hoặc vi phạm quy định pháp luật.",
      "Mọi thay đổi về điều khoản sẽ được cập nhật công khai trên cổng thông tin chính thức và có hiệu lực ngay khi đăng tải."
    ],
    note: "Nếu Quý khách không đồng ý với bất kỳ điều khoản nào trong văn bản này, vui lòng ngưng sử dụng dịch vụ hoặc liên hệ Tổng đài CSKH 1800 1260 để được tư vấn thêm."
  },
  "chinh-sach-bao-mat": {
    title: "Chính sách bảo mật & Bảo vệ dữ liệu cá nhân",
    categoryName: "Điều khoản pháp lý",
    lastUpdated: "Cập nhật hôm nay",
    intro: "VinFast cam kết bảo vệ tuyệt đối dữ liệu cá nhân của khách hàng tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân và các quy định pháp luật hiện hành của Việt Nam.",
    steps: [
      "Thu thập dữ liệu: Chúng tôi thu thập thông tin tên, số điện thoại, địa chỉ nhận xe, thông tin thanh toán khi Quý khách thực hiện đặt cọc.",
      "Mục đích sử dụng: Thông tin được dùng để xác nhận đơn cọc, định danh xe bàn giao, cấp sổ bảo hành điện tử và xử lý thanh toán.",
      "Bảo mật thông tin: Dữ liệu được mã hóa bằng chuẩn SSL 256-bit và lưu trữ trên hệ thống máy chủ bảo mật đa lớp.",
      "Chia sẻ dữ liệu: VinFast không bán hoặc chia sẻ thông tin cho bên thứ ba ngoại trừ các đại lý ủy quyền bàn giao xe và đối tác thanh toán liên kết.",
      "Quyền của khách hàng: Quý khách có quyền yêu cầu tra cứu, chỉnh sửa hoặc yêu cầu xóa bỏ dữ liệu cá nhân bất kỳ lúc nào."
    ],
    note: "Mọi thắc mắc liên quan đến xử lý dữ liệu cá nhân, Quý khách vui lòng gửi email về privacy@vinfast.vn hoặc gọi Hotline 1800 1260."
  },
  "quy-dinh-dat-mua": {
    title: "Quy định & Thỏa thuận đặt cọc giữ chỗ mua xe",
    categoryName: "Điều khoản pháp lý",
    lastUpdated: "Cập nhật hôm nay",
    intro: "Văn bản này quy định chi tiết các quyền lợi, nghĩa vụ và quy trình xử lý khoản cọc giữ chỗ mua xe máy điện VinFast trên nền tảng O2O.",
    steps: [
      "Mức cọc tối thiểu: Gói cọc linh hoạt là 2.000.000 đ/xe, gói cọc cam kết nhận xe sớm là 5.000.000 đ/xe hoặc theo chương trình ưu đãi áp dụng.",
      "Thời hạn giữ chỗ: Đơn cọc có hiệu lực giữ chỗ trong 30 ngày kể từ khi thanh toán thành công.",
      "Chính sách rút cọc: Đối với cọc linh hoạt, khách hàng được hoàn 100% tiền cọc nếu đổi ý trước khi hệ thống gán số VIN chính thức.",
      "Quy trình nhận xe: Khách hàng xuất trình Mã vé cọc (QR Code) và CCCD chính chủ tại Showroom đã chọn để làm thủ tục nhận xe.",
      "Chuyển nhượng đơn cọc: Đơn cọc chỉ được chuyển nhượng cho người thân cùng hộ khẩu hoặc có văn bản ủy quyền hợp lệ."
    ],
    note: "Khoản cọc cam kết sẽ không được hoàn lại nếu khách hàng tự ý đơn phương hủy hợp đồng sau khi xe đã xuất khỏi kho nhà sản xuất."
  },
  "cookie-tracking": {
    title: "Chính sách Cookie & Công nghệ định danh tracking",
    categoryName: "Điều khoản pháp lý",
    lastUpdated: "Cập nhật hôm nay",
    intro: "Website VinFast O2O sử dụng Cookie và các công nghệ theo dõi tương tự để nâng cao trải nghiệm người dùng, lưu cấu hình chọn xe và phân tích lưu lượng truy cập.",
    steps: [
      "Cookie cần thiết: Giúp duy trì phiên đăng nhập, giỏ hàng cọc xe và bảo mật giao dịch.",
      "Cookie phân tích: Giúp đo lường hiệu suất website và tối ưu hóa tốc độ tải trang.",
      "Cookie tùy chỉnh: Lưu trữ lịch sử tìm kiếm Showroom và cấu hình dòng xe yêu thích của Quý khách.",
      "Quản lý Cookie: Quý khách có thể tùy chỉnh chấp nhận hoặc từ chối Cookie thông qua cài đặt trình duyệt web.",
      "Vô hiệu hóa Cookie: Việc từ chối Cookie cần thiết có thể ảnh hưởng đến một số tính năng thanh toán trực tuyến trên trang."
    ],
    note: "VinFast cam kết không sử dụng Cookie để thu thập thông tin nhạy cảm hoặc theo dõi hành vi ngoài phạm vi hệ sinh thái dịch vụ VinFast."
  },
  "giai-quyet-tranh-chap": {
    title: "Quy trình tiếp nhận & Giải quyết tranh chấp khiếu nại",
    categoryName: "Điều khoản pháp lý",
    lastUpdated: "Cập nhật hôm nay",
    intro: "VinFast tôn trọng và nghiêm túc thực hiện các quy định bảo vệ quyền lợi người tiêu dùng. Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết thông qua thương lượng hòa giải.",
    steps: [
      "Bước 1 - Tiếp nhận khiếu nại: Khách hàng gửi yêu cầu qua Hotline 1800 1260 hoặc Trực tiếp tại Hệ thống Showroom toàn quốc.",
      "Bước 2 - Xác minh thông tin: Bộ phận Chăm sóc khách hàng tiến hành kiểm tra nhật ký giao dịch và làm việc với Showroom liên quan trong 24h.",
      "Bước 3 - Thương lượng giải quyết: VinFast đưa ra phương án xử lý (hoàn tiền, đổi xe hoặc bồi thường) dựa trên quy định hợp đồng.",
      "Bước 4 - Phản hồi kết quả: Khách hàng nhận văn bản phản hồi chính thức trong vòng 3 - 5 ngày làm việc.",
      "Bước 5 - Xử lý pháp lý: Nếu không đạt thỏa thuận chung, vụ việc sẽ được đưa ra Tòa án nhân dân có thẩm quyền để giải quyết."
    ],
    note: "Mọi khiếu nại về tình trạng xe bàn giao cần được lập biên bản kiểm tra ngay tại thời điểm bàn giao xe ở Showroom."
  },
  "phap-ly-doanh-nghiep": {
    title: "Thông tin pháp lý doanh nghiệp & Giấy phép hoạt động",
    categoryName: "Điều khoản pháp lý",
    lastUpdated: "Cập nhật hôm nay",
    intro: "Thông tin pháp lý công khai của Công ty Cổ phần Sản xuất và Kinh doanh VinFast - đơn vị vận hành Nền tảng O2O.",
    steps: [
      "Tên doanh nghiệp: CÔNG TY CỔ PHẦN SẢN XUẤT VÀ KINH DOANH VINFAST.",
      "Mã số doanh nghiệp: 0108926210 do Sở Kế hoạch và Đầu tư TP. Hà Nội cấp lần đầu ngày 02/10/2019.",
      "Địa chỉ trụ sở chính: Khu kinh tế Đình Vũ - Cát Hải, Phường Đông Hải 2, Quận Hải An, TP. Hải Phòng, Việt Nam.",
      "Giấy phép TMĐT: Đã đăng ký với Bộ Công Thương theo quy định về Thương mại điện tử O2O.",
      "Đại diện pháp luật: Tổng Giám đốc Công ty Cổ phần VinFast."
    ],
    note: "Website VinFast O2O là cổng thông tin chính thức duy nhất. Khách hàng lưu ý tránh các trang web giả mạo thương hiệu VinFast để phòng ngừa rủi ro lừa đảo."
  },
  "gioi-thieu-vinfast": {
    title: "Giới thiệu thương hiệu & Hệ sinh thái xe điện thông minh VinFast",
    categoryName: "Về chúng tôi",
    lastUpdated: "Cập nhật hôm nay",
    intro: "VinFast là thành viên của Tập đoàn Vingroup – Tập đoàn kinh doanh đa ngành lớn nhất Việt Nam. Được thành lập năm 2017, VinFast là hãng xe điện thông minh tiên phong thúc đẩy cuộc cách mạng giao thông xanh toàn cầu.",
    steps: [
      "Lịch sử phát triển: Từ nhà máy sản xuất ô tô hiện đại hàng đầu thế giới tại Hải Phòng đến thương hiệu xe điện niêm yết trên sàn Nasdaq (Mỹ) với mã VFS.",
      "Hệ sinh thái sản phẩm: Đa dạng dòng sản phẩm từ Xe máy điện thông minh (Evo200, Feliz, Klara, Vento, Theon) đến Ô tô điện thông minh (VF 3, VF 5, VF 6, VF 7, VF 8, VF 9) và Xe buýt điện VinBus.",
      "Tự chủ công nghệ: Sở hữu công nghệ pin LFP cao cấp, phần mềm quản lý xe thông minh và mạng lưới hạ tầng trạm sạc phủ khắp 63 tỉnh thành.",
      "Nền tảng O2O: Kết nối trực tiếp trải nghiệm đặt cọc trực tuyến và nhận xe tại hệ thống Showroom & Đại lý ủy quyền trên toàn quốc.",
      "Thị trường quốc tế: Hiện diện và mở rộng quy mô kinh doanh tại Mỹ, Canada, Châu Âu, Ấn Độ và Indonesia."
    ],
    note: "Với tinh thần 'Khởi nghiệp bước ra thế giới', VinFast liên tục nâng cao chất lượng dịch vụ và lấy khách hàng làm trung tâm trong mọi hoạt động."
  },
  "tam-nhin-su-menh": {
    title: "Tầm nhìn chiến lược & Sứ mệnh vì một tương lai xanh",
    categoryName: "Về chúng tôi",
    lastUpdated: "Cập nhật hôm nay",
    intro: "Tầm nhìn và sứ mệnh của VinFast định hướng hành động cho toàn bộ đội ngũ hướng tới xây dựng một thế giới xanh, thông minh và phát triển bền vững.",
    steps: [
      "Tầm nhìn toàn cầu: Trở thành thương hiệu xe điện thông minh hàng đầu thế giới, dẫn dắt xu hướng di chuyển điện hóa tại Việt Nam và vươn tầm quốc tế.",
      "Sứ mệnh cốt lõi: 'Vì một tương lai xanh cho mọi người' — Phổ cập xe điện chất lượng cao với chi phí sở hữu hợp lý cho người tiêu dùng.",
      "Giá trị cốt lõi - Đổi mới sáng tạo: Liên tục nâng cấp công nghệ tự hành, trợ lý ảo tiếng Việt Viva và trải nghiệm người dùng trên ứng dụng VinFast.",
      "Giá trị cốt lõi - Chất lượng vượt trội: Tiêu chuẩn an toàn 5 sao quốc tế và chế độ bảo hành 10 năm vượt trội so với ngành ô tô.",
      "Cam kết bền vững: Giảm thiểu phát thải carbon và đồng hành cùng Chính phủ Việt Nam đạt mục tiêu Net Zero vào năm 2050."
    ],
    note: "Mọi sản phẩm xe máy điện và ô tô điện VinFast đều hướng tới sự kết hợp hoàn hảo giữa thiết kế Ý, công nghệ Mỹ và bản lĩnh Việt Nam."
  },
  "ban-lanh-dao": {
    title: "Đội ngũ Ban lãnh đạo & Hội đồng quản trị VinFast Group",
    categoryName: "Về chúng tôi",
    lastUpdated: "Cập nhật hôm nay",
    intro: "Tập thể lãnh đạo VinFast quy tụ các chuyên gia hàng đầu giàu kinh nghiệm từ các tập đoàn công nghệ và ô tô lớn trên toàn thế giới.",
    steps: [
      "Chủ tịch Hội đồng quản trị: Ông Phạm Nhật Vượng — Người sáng lập Tập đoàn Vingroup và là thuyền trưởng kiến tạo tầm nhìn xe điện toàn cầu.",
      "Tổng Giám đốc Toàn cầu: Bà Lê Thị Thu Thủy — Điều hành chiến lược phát triển kinh doanh quốc tế và các thương vụ niêm yết niêm yết chứng khoán.",
      "Khối Kỹ thuật & Sản xuất: Quy tụ các kỹ sư hàng đầu từ BMW, General Motors, Porsche và Tesla tham gia thiết kế phát triển xe.",
      "Khối Công nghệ & Phần mềm: Đội ngũ chuyên gia VinAI & VinBrain ứng dụng công nghệ trí tuệ nhân tạo (AI) vào quản lý vận hành xe.",
      "Đội ngũ Vận hành O2O: Hơn 5.000 cán bộ nhân viên tại hệ thống Showroom toàn quốc cam kết mang tới dịch vụ tận tâm 24/7."
    ],
    note: "Đội ngũ quản lý VinFast luôn duy trì văn hóa 'Tốc độ - Sáng tạo - Bản lĩnh - Chu đáo' trong từng quyết định kinh doanh."
  },
  "tuyen-dung": {
    title: "Cơ hội nghề nghiệp & Chương trình Tuyển dụng tài năng VinFast",
    categoryName: "Về chúng tôi",
    lastUpdated: "Cập nhật hôm nay",
    intro: "Gia nhập VinFast để trở thành một phần của sứ mệnh kiến tạo thương hiệu Việt vươn tầm thế giới và nâng tầm sự nghiệp trong môi trường quốc tế năng động.",
    steps: [
      "Lĩnh vực tuyển dụng: Kỹ sư phần mềm ô tô, Chuyên viên phát triển Nền tảng O2O, Quản lý Showroom, Tư vấn bán hàng & Kỹ thuật viên bảo hành.",
      "Môi trường làm việc: Văn phòng hiện đại, văn hóa đa quốc gia với các chuyên gia đến từ hơn 20 quốc gia trên thế giới.",
      "Chế độ đãi ngộ: Lương thưởng cạnh tranh, gói bảo hiểm sức khỏe cao cấp Vingroup và ưu đãi mua xe điện VinFast cho nhân viên.",
      "Quy trình tuyển dụng: (1) Nộp hồ sơ Online ➔ (2) Phỏng vấn Chuyên môn ➔ (3) Đánh giá Năng lực ➔ (4) Nhận thư mời làm việc (Offer).",
      "Kênh nộp hồ sơ: Gửi CV trực tiếp qua email tuyendung@vinfast.vn hoặc theo dõi cổng tuyển dụng chính thức Vingroup Careers."
    ],
    note: "VinFast luôn chào đón những ứng viên tài năng, giàu nhiệt huyết và khát khao khẳng định giá trị bản thân."
  }
};

const TOPICS = [
  { label: "Sử dụng Xe", id: "su-dung-xe", desc: "Hướng dẫn vận hành & sạc xe" },
  { label: "Pin & Trạm Sạc", id: "pin-tram-sac", desc: "Biểu phí sạc & quy định thuê pin" },
  { label: "Chính sách Bảo hành", id: "bao-hanh", desc: "Bảo hành điện tử & bảo dưỡng" },
  { label: "Hướng dẫn Trả góp", id: "tra-gop", desc: "Trả góp 0% qua thẻ & ngân hàng" }
];

interface PageProps {
  params: Promise<{ category: string }>;
}

export default function ArticleDetailPage({ params }: PageProps) {
  const { category } = React.use(params);
  const article = ARTICLE_DB[category];

  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-neutral-50/20">
      
      {/* Breadcrumb Navigation */}
      <nav className="mb-8 flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2 text-xs font-semibold text-gray-500">
          <li className="inline-flex items-center">
            <Link href="/" className="hover:text-[#E30613] transition-colors">
              Trang chủ
            </Link>
          </li>
          <li className="flex items-center gap-1.5 md:gap-2">
            <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <Link href="/ho-tro" className="hover:text-[#E30613] transition-colors">
              Hỗ trợ
            </Link>
          </li>
          <li className="flex items-center gap-1.5 md:gap-2 text-gray-400 font-medium line-clamp-1 max-w-[150px] sm:max-w-xs md:max-w-md">
            <svg className="h-3.5 w-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span>{article.title}</span>
          </li>
        </ol>
      </nav>

      {/* Main Grid: Left sidebar (25%) / Right content (75%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* LEFT COLUMN: Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-4 px-1.5">
              Chủ đề Hỗ trợ khác
            </h3>
            <nav className="flex flex-col gap-1">
              {TOPICS.map((topic) => {
                const isActive = topic.id === category;
                return (
                  <Link
                    key={topic.id}
                    href={`/ho-tro/${topic.id}`}
                    className={`group text-left py-3 transition-all duration-200 block border-l-2 ${
                      isActive
                        ? "text-[#E30613] border-[#E30613] pl-4 bg-red-50/10"
                        : "text-gray-600 hover:text-[#E30613] border-transparent pl-4 hover:border-gray-200 hover:bg-gray-50/40"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-black leading-none">{topic.label}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1.5 group-hover:text-gray-500 leading-snug">
                        {topic.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Hotline Card */}
          <div className="rounded-2xl border border-red-100 bg-red-50/30 p-5 space-y-4">
            <h4 className="text-xs font-bold text-gray-900">Liên hệ cứu hộ khẩn cấp</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
              Gặp sự cố kỹ thuật hoặc hết điện giữa đường? Hãy liên hệ ngay hotline hỗ trợ cứu hộ xe máy điện của chúng tôi.
            </p>
            <a
              href="tel:1900232389"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E30613] px-4 py-3 text-xs font-black text-white hover:bg-[#b8040d] transition duration-200 shadow-md shadow-red-200"
            >
              Hotline 24/7: 1900 2323 89
            </a>
          </div>
        </aside>

        {/* RIGHT COLUMN: Article Content */}
        <section className="lg:col-span-9 bg-white rounded-3xl border border-gray-150 p-6 sm:p-10 shadow-sm">
          
          {/* Header metadata */}
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-[#E30613] ring-1 ring-red-100 uppercase tracking-wider">
              {article.categoryName}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
              {article.title}
            </h1>
            <span className="text-xs font-semibold text-gray-400 block pt-1">
              {article.lastUpdated}
            </span>
          </div>

          <div className="border-b border-gray-100 my-6" />

          {/* Intro Paragraph */}
          <p className="text-sm sm:text-base leading-relaxed text-gray-600 mb-8 font-medium">
            {article.intro}
          </p>

          {/* Steps Ordered List */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Các bước thực hiện chi tiết:</h3>
            <ol className="space-y-5 list-decimal pl-5 text-sm sm:text-base text-gray-700 font-semibold leading-relaxed">
              {article.steps.map((step, idx) => (
                <li key={idx} className="pl-1">
                  <span className="font-medium text-gray-600 block mt-1">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Important Note Alert Box */}
          <div className="bg-red-50 border-l-4 border-[#E30613] p-5 rounded-r-xl text-xs sm:text-sm text-red-950 leading-relaxed my-8 shadow-sm">
            <div className="flex gap-3 items-start">
              <span className="text-base leading-none shrink-0 mt-0.5">⚠️</span>
              <div>
                <span className="font-black uppercase tracking-wider text-red-800 block mb-1">Lưu ý quan trọng</span>
                <p className="text-xs font-semibold text-red-900/90 leading-relaxed">{article.note}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 my-8 pt-6" />

          {/* Feedback Widget */}
          <div className="bg-neutral-50/60 rounded-2xl border border-neutral-100 p-6 flex flex-col items-center justify-between gap-4 text-center sm:text-left sm:flex-row shadow-inner">
            {feedback === null ? (
              <>
                <h4 className="text-sm font-bold text-gray-800">
                  Bài viết này có giúp ích cho bạn không?
                </h4>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => setFeedback("yes")}
                    className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition duration-200 cursor-pointer shadow-sm"
                  >
                    Có, cảm ơn
                  </button>
                  <button
                    onClick={() => setFeedback("no")}
                    className="px-5 py-2.5 rounded-full border border-gray-300 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition duration-200 cursor-pointer shadow-sm"
                  >
                    Không
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-center gap-3 py-1 animate-in fade-in zoom-in duration-300">
                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  ✓
                </div>
                <p className="text-xs font-bold text-gray-700 leading-normal">
                  {feedback === "yes"
                    ? "Cảm ơn bạn đã phản hồi! Đánh giá tích cực của bạn giúp chúng tôi nâng cao chất lượng bài viết."
                    : "Cảm ơn bạn đã phản hồi! VinFast sẽ tiếp nhận và cải thiện nội dung bài viết này tốt hơn."}
                </p>
              </div>
            )}
          </div>

        </section>
      </div>

    </main>
  );
}
