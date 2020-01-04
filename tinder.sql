create database tinder;
use tinder;

create table users (
	id char(255) not null,
    pass char(255) not null,
    nameuser nvarchar(255) not null,
    registered datetime,
    last_login datetime,
    brithday date,
    phone varchar(11),
    email varchar(255),
    gender nvarchar(6),
    facebookID varchar(60),
    infor text,
    job text,
    gendertomatch nvarchar(6),
    location text,
    primary key (id)
);
alter table users
	add constraint C_GENDER
    check (gender in ('male','female'));
    
create table likes (
	user_id char(16),
    liked_user char(16),
    datelike datetime,
    primary key(user_id , liked_user)
);
alter table likes 
	add constraint FK_USER_LIKE
    foreign key (user_id)
    references users(id),
	add constraint FK_LIKED_USER
    foreign key (liked_user)
    references users(id); 
    
create table superlikes (
	user_id char(16),
    superliked_user char(16),
    datelike datetime
);

alter table superlikes 
	add constraint FK_USER_SUPERLIKE
    foreign key (user_id)
    references users(id),
	add constraint FK_SUPERLIKED_USER
    foreign key (superliked_user)
    references users(id); 

create table matchs(
	user1 char(16),
    user2 char(16),
    datematch datetime,
    primary key (user1,user2)
);
alter table matchs
	add constraint FK_USER1
    foreign key(user1)
    references users(id),
    add constraint FK_USER2
    foreign key(user2)
    references users(id)
    
