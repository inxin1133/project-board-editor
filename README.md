# git command 
먼저 github에 원격 저장소를 만들어 놓아야 함

### 깃초기화(새로운 프로젝트 또는 IDE환경에서 초기화)
$ git init

------------------------------------------------------------------------------

## 초기 설정

### 전체파일 올림
$ git add .

### 올릴파일 선택
$ git add README.md

### 현재 원격 저장소에 신규로 변경된 파일 보기 (수정된 파일만 보이게됨)
$ git status

### 메시지 남기기
$ git commit -m "first commit"

### branch 설정 (이름은 마음대로 설정 - master 또는 main 등)
$ git branch -M master

### git 연동 
$ git remote add origin https://github.com/inxin1133/[프로젝트명.git]

###  파일올리기
$ git push -u origin master



-----------------------------------------------------------

## 설정후 업로드
$ git add .

$ git commit -m "메시지"

$ git push -u origin master


----------------------------------------------------------------------------------

## 계정연결 필요 시 (처음)
$ git config --global user.email "inxin1133@gmail.com"

$ git config --global user.name "inxin1133"

---------------------------------------------------------------------------------

## github에 저장되어 있는 프로젝트를 로컬로 받아오기
$ git clone https://github.com/사용자명/저장소명.git

---------------------------------------------------------------------------------

## 원격 저장소의 변경사항을 가져와서 로컬과 병합
로컬 브랜치(master)가 원격 브랜치(origin/master)보다 뒤처져 있는 경우
### (원격 저장소에 로컬에 없는 커밋이 있음), 리모트 변경사항을 먼저 가져와야 함
master 브랜치를 pull하여 업데이트

$ git pull origin master

### master 브랜치를 fetch하여 업데이트
$ git fetch origin master

pull 과 fetch 의 차이점은 merge 작업을 하느냐 안하느냐로 나뉘어지며.
pull 은 fetch + merge 작업이라고 생각하시면 됩니다.

-------------------------------------------------------------------------------

### 현재 프로젝트가 설정되어 있는 github 원격저장소 보기
$ git remote -v

### 현재 프로젝트 연결되어 있는 연결 끊기
$ git remote remove origin

### 새로운 저장소 연결
$ git remote add origin 새로운저장소URL


----------------------------------------------------------------------------

### 우선 현재 브랜치가 아닌 다른 브랜치로 전환
$ git checkout [다른 브랜치 이름] 

### 필요없는 브런치 삭제
$ git push origin --delete main

----------------------------------------------------------------------------

## 원격 파일 삭제 
### 원격 저장소와 로컬 저장소에 있는 파일을 삭제한다.
$ git rm [File Name]

### 원격 저장소에 있는 파일을 삭제한다. 로컬 저장소에 있는 파일은 삭제하지 않는다.
$ git rm --cached [File Name]

### 예시
.idea/modules.xml 파일 삭제
$ git rm --cached .idea/modules.xml

.idea 폴더 하위의 모든 파일 삭제 
$ git rm --cached -r .idea/




-----------------------------------------------------------------------------

## 소스병합
### master -> some_file.txt의 내용
1번째 단계 HEAD
> I'm a file.

# sub -> some_file.txt의 내용
### 2번째 단계 HEAD (최신)
> I'm a file.
>
> Inserted new line from the sub branch.

### 브랜치 선택
$ git checkout -f master

### 현재 브랜치 master, 대상 브랜치 sub.
$ git merge sub
main에서 sub를 머지합니다.
HEAD -> main
sub  -> sub

### merge 이후 main -> some_file.txt
> I'm a file.
>
> Inserted new line from the sub branch.