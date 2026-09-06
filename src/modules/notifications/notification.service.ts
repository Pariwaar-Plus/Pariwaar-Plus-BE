import { Prisma } from "@prisma/client";
import {
  CreateNotificationDto,
  UpdateNotificationDto
} from "./types/notification.dto";
import prisma from "../../config/prisma";

export const createNotification = async (
  userId: string,
  data: CreateNotificationDto
) => {
  return prisma.notification.create({
    data: {
      type: data.type,
      content: data.content,
      userId,
    },
  });
};

export const getNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getUnreadNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: {
      userId,
      hasRead: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateNotification = async (
  notificationId: string,
  userId: string,
  data: UpdateNotificationDto
) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data,
  });
};

export const markAllNotificationsAsRead = async (
  userId: string
) => {
  return prisma.notification.updateMany({
    where: {
      userId,
      hasRead: false,
    },
    data: {
      hasRead: true,
    },
  });
};

export const deleteNotification = async (
  notificationId: string,
  userId: string
) => {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });
};