# Bugfix Requirements Document

## Introduction

Trong luồng citizen (frontend), translation key `citizen.map.myLocation` bị thiếu trong cả hai file messages locale (`en.json` và `vi.json`). Key này được sử dụng tại component `CitizenMap.tsx` (dòng 527) để hiển thị tooltip cho nút định vị GPS trên bản đồ. Khi người dùng truy cập trang bản đồ (`/citizen/map`), thư viện `next-intl` ném lỗi `MISSING_MESSAGE: Could not resolve 'citizen.map.myLocation' in messages for locale 'en'`, khiến tính năng bản đồ không hoạt động đúng.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN người dùng truy cập trang bản đồ citizen (`/citizen/map`) với locale `en` THEN hệ thống ném lỗi `MISSING_MESSAGE: Could not resolve 'citizen.map.myLocation' in messages for locale 'en'`

1.2 WHEN người dùng truy cập trang bản đồ citizen (`/citizen/map`) với locale `vi` THEN hệ thống ném lỗi `MISSING_MESSAGE: Could not resolve 'citizen.map.myLocation' in messages for locale 'vi'`

1.3 WHEN component `CitizenMap` render nút định vị GPS THEN hệ thống không hiển thị được tooltip cho nút đó do key `myLocation` không tồn tại trong namespace `citizen.map` của bất kỳ locale nào

### Expected Behavior (Correct)

2.1 WHEN người dùng truy cập trang bản đồ citizen với locale `en` THEN hệ thống SHALL resolve key `citizen.map.myLocation` thành chuỗi `"My Location"` mà không ném lỗi

2.2 WHEN người dùng truy cập trang bản đồ citizen với locale `vi` THEN hệ thống SHALL resolve key `citizen.map.myLocation` thành chuỗi `"Vị trí của tôi"` mà không ném lỗi

2.3 WHEN component `CitizenMap` render nút định vị GPS THEN hệ thống SHALL hiển thị tooltip với text đã được dịch đúng theo locale hiện tại

### Unchanged Behavior (Regression Prevention)

3.1 WHEN người dùng truy cập trang bản đồ citizen với bất kỳ locale nào THEN hệ thống SHALL CONTINUE TO resolve tất cả các key hiện có trong namespace `citizen.map` (ví dụ: `title`, `shelters`, `route`, `getGps`, v.v.) đúng như trước

3.2 WHEN người dùng sử dụng các tính năng khác trong namespace `citizen.map` (tìm đường, tìm điểm tị nạn, tìm địa điểm gần đây) THEN hệ thống SHALL CONTINUE TO hiển thị đúng các chuỗi đã dịch tương ứng

3.3 WHEN người dùng chuyển đổi giữa locale `en` và `vi` THEN hệ thống SHALL CONTINUE TO cập nhật toàn bộ giao diện bản đồ theo locale mới, bao gồm key `myLocation` vừa được thêm
