-- 기업 데이터 일괄 등록 SQL
-- Supabase SQL Editor에서 실행하세요

INSERT INTO companies (name, business_number, representative, id_number, phone, email, password, site_url, commission, active) VALUES
('(주)경리업무를잘하는청년들', '', '금종석', '830612-1111211', '010-4154-0133', 'wapeople1@naver.com', 'rudckfcjd1@', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 0, true),
('리현커머스', '', '정도연', '911215-2081710', '010-6798-2729', 'cyj_@naver.com', 'nana1030!', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 0, true),
('하우스스튜디오', '', '박경섭', '821031-1020441', '010-8907-1031', 'aartcrew@naver.com', 'dk!@200334', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 12, true),
('아트크루', '', '박설아', '920215-2183033', '010-5267-4852', 'aartcrew@naver.com', 'dk!@200334', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 12, true),
('(주)와컴퍼니', '', '김정태', '820714-1018910', '010-2720-2098', 'threem571@gmail.com', 'rlawjdxo1!', '', 0, true),
('세무법인청년들 본점', '', '최정만', '740211-1449212', '010-3418-7142', 'kc.kenny90@gmail.com', 'rudckfcjd2@', '', 0, true),
('살롱드(SALONDE)머바르니 (2호점)', '', '조현진', '910418-2059217', '010-4493-4788', 'muvareni@naver.com', 'zzz1212000', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 0, true),
('머바르니 네일 기흥본점 (1호점)', '', '조현희', '940917-2059228', '010-6674-4788', '94alone@naver.com', 'hyunjin4180!', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 20, true),
('주식회사 머바르니', '', '조현진', '910418-2059217', '010-4493-4788', 'hyunjin418@naver.com', 'mubareuni', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 0, true),
('머바르니스파&에스테틱', '', '조현진', '910418-2059217', '010-4493-4788', 'ajqkfmsldptmxpxlr@proton.me', 'rudckfcjd1!', 'https://account.proton.me/ko/login', 0, true),
('다원메디칼', '', '김지웅', '810105-1079413', '010-8228-1015', 'dawon4935@naver.com', '@lspine45', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 0, true),
('본치과기공소', '', '조승제', '850319-1178214', '010-9124-4160', 'kby7259@naver.com', 'jo1178214!', 'https://nid.naver.com/nidlogin.login?mode=form&url=https://www.naver.com/', 0, true),
('(주)대성의료종합가스', '', '이근우', '740807-1005512', '010-8778-7426', 'eotjddmlfy@proton.me', 'rudckfcjd1!', 'https://account.proton.me/ko/login', 0, true),
('제이엠컴퍼니', '', '변정민', '980310-1540312', '010-7697-9041', 'wpdldpazjavjsl@proton.me', 'rudckfcjd1!', 'https://account.proton.me/ko/login', 0, true),
('놀러오개 애견유치원', '', '변정민', '980310-1540312', '010-7697-9041', 'wpdldpazjavjsl@proton.me', 'rudckfcjd1!', 'https://account.proton.me/ko/login', 0, true),
('(주)비젼디자인', '', '정재근', '731215-1046612', '', 'qlwuselwkdls@proton.me', 'rudckfcjd1!', 'https://account.proton.me/ko/login', 20, true),
('플러스82', '', '유종현', '940917-1170228', '010-5732-1488', 'vmffjtm82@proton.me', 'rudckfcjd1!', 'https://account.proton.me/ko/login', 15, true),
('주식회사 사우스코어', '', '김용휘', '880820-1168014', '010-4808-4097', 'tkdntmzhdj@proton.me', 'rudckfcjd1!', 'https://account.proton.me/ko/login', 15, true),
('주식회사 메데이아', '', '정은정', '790506-2169415', '010-3387-7995', 'apepdldk@proton.me', 'rudckfcjd1!', 'https://account.proton.me/ko/login', 0, true),
('바이도', '', '권석준, 정건', '981210-1203525', '010-4823-3065', 'qkdleh@proton.me', 'rudckfcjd1!', 'https://account.proton.me/login', 15, true),
('고스트블랙연남', '260-85-02820', '김도연', '930129-2041238', '010-4666-6407', 'wapeople1@naver.com', 'cjdsusemf1@', 'https://mail.naver.com/v2/folders/0/all', 0, true);

-- 등록 완료 확인
SELECT COUNT(*) as total_companies FROM companies;
SELECT name, representative, commission FROM companies ORDER BY id DESC LIMIT 21;





