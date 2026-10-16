create table if not exists blob_chunks(key text not null,idx integer not null,data blob not null,primary key(key,idx)) without rowid;
