import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "settings" })
export class SettingEntity {
  @PrimaryColumn()
  key: string;

  @Column()
  value: string;
}
